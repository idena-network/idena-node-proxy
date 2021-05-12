const express = require('express');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const config = require('./configuration');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();

let keys
let isReady = false

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadRemoteKeys() {
  let error = false
  do {
    try {
      keys = await axios.get(config.remoteKeys.url,
        {
          headers: { 'Authorization': config.remoteKeys.authorization + 1 }
        })
        .then(x => x.data)
      isReady = true
    }
    catch (e) {
      console.log('Error while loading keys', e)
      error = true
      await sleep(1000)
    }
  } while(error)
}

if (config.remoteKeys.enabled) {
  loadRemoteKeys()
  setInterval(loadRemoteKeys, config.remoteKeys.interval)
} else {
  keys = config.apiKeys
  isReady = true
}

const rateLimiter = rateLimit({
  ...config.rateLimit,
  keyGenerator(req) {
    return req.body ? req.body.key : 'undefined';
  },
  skip(req) {
    return req.body && req.body.key === config.godApiKey
  }
});

const proxy = createProxyMiddleware({
  changeOrigin: true,
  secure: false,
  target: config.node.url,
  onProxyReq(proxyReq, req) {
    const data = JSON.stringify({ ...req.body, key: config.node.key });
    proxyReq.setHeader('Content-Length', Buffer.byteLength(data));
    proxyReq.write(data);
  },
});

const keyChecker = function (req, res, next) {
  if (!isReady) {
    res.status(400).send('proxy is starting...');
    return;
  }
  if (config.methods.indexOf(req.body.method) === -1) {
    res.status(403).send('method not available');
    return;
  }
  if (keys.indexOf(req.body.key) === -1 && req.body.key !== config.godApiKey) {
    res.status(403).send('API key is invalid');
    return;
  }
  next();
};

morgan.token('body', (req, res) => JSON.stringify(req.body));
morgan.token('apiKey', (req, res) => (req.body ? req.body.key : null));

app.use(cors());
app.use(bodyParser.json());

if (config.logs.output === 'file') {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, config.logs.file),
    {
      flags: 'a',
    }
  );
  app.use(
    morgan(config.logs.format, {
      stream: accessLogStream,
    })
  );
}
if (config.logs.output === 'stdout') {
  app.use(morgan(config.logs.format));
}

app.use(rateLimiter);
app.use(keyChecker);
app.use(proxy);

app.listen(parseInt(config.port));
