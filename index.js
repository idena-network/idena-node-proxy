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

let keys = []
let isReady = false

async function loadRemoteKeys() {
  try {
    keys = await axios.get(config.remoteKeys.url,
      {
        headers: { 'Authorization': config.remoteKeys.authorization }
      })
      .then(x => x.data)

    isReady = true
    setTimeout(loadRemoteKeys, config.remoteKeys.interval)
  }
  catch (e) {
    isReady = false
    console.log('Error while loading keys', e)
    setTimeout(loadRemoteKeys, 5000)
  }
}

if (config.remoteKeys.enabled) {
  loadRemoteKeys()
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
  if (config.methods.indexOf(req.body.method) === -1) {
    res.status(403).send('method not available');
    return;
  }
  if (req.body.key === config.godApiKey) {
    return next()
  }
  if (!isReady) {
    res.status(400).send('proxy is not started');
    return;
  }
  if (keys.indexOf(req.body.key) === -1) {
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
