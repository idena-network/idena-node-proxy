require("dotenv-flow").config()
const fs = require("fs")
const merge = require("deepmerge")

const defaultConfig = require("./config_default.json")
let config

const configPath = process.env.CONFIG_PATH || "./config.json"

if (fs.existsSync(configPath)) {
  const result = fs.readFileSync(configPath)
  config = JSON.parse(result)

  if (!config.port) {
    config.port = defaultConfig.port
  }

  config.rateLimit = merge(defaultConfig.rateLimit, config.rateLimit || {})
  config.apiKeys = merge(defaultConfig.apiKeys, config.apiKeys || [])
  config.remoteKeys = merge(defaultConfig.remoteKeys, config.remoteKeys || {})
  config.check = merge(defaultConfig.check, config.check || {})
  config.node = merge(defaultConfig.node, config.node || {})
  config.logs = merge(defaultConfig.logs, config.logs || {})

  if (!config.methods?.length) config.methods = defaultConfig.methods
  if (!config.cache) config.cache = defaultConfig.cache
} else {
  config = defaultConfig
}



// support old env variables
if (process.env.PORT) {
  config.port = process.env.PORT
}

if (process.env.AVAILABLE_KEYS) {
  config.apiKeys = JSON.parse(process.env.AVAILABLE_KEYS)
}

if (process.env.REMOTE_KEYS_ENABLED) {
  config.remoteKeys.enabled = !!+process.env.REMOTE_KEYS_ENABLED
}

if (process.env.REMOTE_KEYS_URL) {
  config.remoteKeys.url = process.env.REMOTE_KEYS_URL
}

if (process.env.REMOTE_KEYS_AUTH) {
  config.remoteKeys.authorization = process.env.REMOTE_KEYS_AUTH
}

if (process.env.GOD_API_KEY) {
  config.godApiKey = process.env.GOD_API_KEY
}

if (process.env.IDENA_URL) {
  config.node.url = process.env.IDENA_URL
}

if (process.env.IDENA_KEY) {
  config.node.key = process.env.IDENA_KEY
}

if (process.env.LOGS_OUTPUT) {
  config.logs.output = process.env.LOGS_OUTPUT
}

// print config
if (process.env.PRINT_CONFIG) {
  console.log(config)
}

module.exports = config
