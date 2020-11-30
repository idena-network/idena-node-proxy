const express = require('express');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const config = require('./config');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();

const rateLimiter = rateLimit({
  ...config.rateLimit,
  keyGenerator(req) {
    return req.body ? req.body.key : 'undefined';
  },
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
  if (config.apiKeys.indexOf(req.body.key) === -1) {
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
