const express = require('express');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const config = require('./config');

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

app.use(cors());
app.use(bodyParser.json());
app.use(rateLimiter);
app.use(keyChecker);
app.use(proxy);

app.listen(parseInt(config.port));
