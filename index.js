const express = require("express")
const bodyParser = require("body-parser")
const { createProxyMiddleware } = require("http-proxy-middleware")
const rateLimit = require("express-rate-limit")
const cors = require("cors")
const config = require("./configuration")
const morgan = require("morgan")
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const app = express()
const { LRUCache } = require("lru-cache")

const options = {
  max: 2000,

  // how long to live in ms
  ttl: 1000 * 60,

  // return stale items before removing from cache?
  allowStale: false,

  updateAgeOnGet: false,
  updateAgeOnHas: false,
}

const lruCache = new LRUCache(options)

let keys = []
let isReady = false

async function loadRemoteKeys() {
  try {
    keys = await axios
      .get(config.remoteKeys.url, {
        headers: { Authorization: config.remoteKeys.authorization },
      })
      .then((x) => x.data)

    isReady = true
    setTimeout(loadRemoteKeys, config.remoteKeys.interval)
  } catch (e) {
    isReady = false
    console.log("Error while loading keys", e)
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
    return req.body ? req.body.key : "undefined"
  },
  skip(req) {
    return req.body && req.body.key === config.godApiKey
  },
})

const proxy = createProxyMiddleware({
  changeOrigin: true,
  secure: false,
  target: config.node.url,
  onProxyReq(proxyReq, req) {
    const data = JSON.stringify({ ...req.body, key: config.node.key })
    proxyReq.setHeader("Content-Length", Buffer.byteLength(data))
    proxyReq.write(data)
  },
})

const keyChecker = function (req, res, next) {
  if (
    config.check &&
    config.check.methods.includes(req.body.method) &&
    config.check.key === req.body.key
  ) {
    return next()
  }
  if (config.methods.indexOf(req.body.method) === -1) {
    res.status(403).send("method not available")
    return
  }
  if (req.body.key === config.godApiKey) {
    return next()
  }
  if (!isReady) {
    res.status(400).send("proxy is not started")
    return
  }
  if (keys.indexOf(req.body.key) === -1) {
    res.status(403).send("API key is invalid")
    return
  }
  next()
}

let cacheDurations = undefined
if (config.cache?.length) {
  cacheDurations = {}
  config.cache.forEach((element) => {
    cacheDurations[element.method] = element
  })
}

const cache = function (req, res, next) {
  if (!cacheDurations) {
    return next()
  }
  if (!cacheDurations[req.body.method]) {
    return next()
  }
  const duration = cacheDurations[req.body.method].duration
  let key = "__express__" + req.body.method + JSON.stringify(req.body.params)
  let cachedBody = lruCache.get(key)
  if (cachedBody) {
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Cache-Control", "max-age=" + duration / 1000)
    res.send(cachedBody)
    return
  } else {
    res.writeResp = res.write    

    var chunks = [];
    res.write = function (chunk) {
      chunks.push(chunk);  
      return res.writeResp.apply(res, arguments);
    }; 

    var oldEnd = res.end;

    res.end = function (chunk) {
      if (chunk)
        chunks.push(chunk);
  
      var body = Buffer.concat(chunks).toString('utf8');      
      const response = JSON.parse(body)      
      if (!response.error) {
        lruCache.set(key, body, { ttl: duration })
      }        
      oldEnd.apply(res, arguments);
    };
    return next()
  }
}

morgan.token("body", (req, res) => JSON.stringify(req.body))
morgan.token("apiKey", (req, res) => (req.body ? req.body.key : null))

app.use(cors())
app.use(bodyParser.json({ limit: "2mb" }))

if (config.logs.output === "file") {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, config.logs.file),
    {
      flags: "a",
    }
  )
  app.use(
    morgan(config.logs.format, {
      stream: accessLogStream,
    })
  )
}
if (config.logs.output === "stdout") {
  app.use(morgan(config.logs.format))
}

app.use(rateLimiter)
app.use(keyChecker)
app.use(cache)
app.use(proxy)

app.listen(parseInt(config.port))
