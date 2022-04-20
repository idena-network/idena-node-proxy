# Idena node proxy

Install all dependencies
`npm i`

Start the local server
`npm run dev`

## Run as Docker

You can build your own docker file or get image from `idena/node-proxy:latest` or by tag `idena/node-proxy:v1.1.0`

### Docker compose example

```
version: "3.8"
services:
  proxy-test:
    image: idena/node-proxy:v1.1.0
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - ./config.json:/home/node/app/config.json
      - ./access.log:/home/node/app/access.log
    environment:
      NODE_ENV: "production"

```

## Configuration

To configure proxy you can use `config.json` file or set custom path with `CONFIG_PATH` environmental variable.

Log can have `stdout` or `file` output.

Default configuration:

```
{
    "port": 3000,
    "rateLimit": {
        "windowMs": 1000,
        "max": 10
    },
    "apiKeys": [],
    "remoteKeys": {
        "enabled": false,
        "url": null,
        "authorization": null,
        "interval": 300000
    },
    "godApiKey": null,
    "check": {
        "key": "check-status-key",
        "methods": [
            "dna_epoch",
            "bcn_syncing"
        ]
    },
    "node": {
        "url": null,
        "key": null
    },
    "logs": {
        "output": "stdout",
        "format": ":date[iso] - :apiKey - :status - :response-time ms - :body - :res[content-length]",
        "file": "access.log"
    },
    "methods": [
        "dna_identity",
        "dna_ceremonyIntervals",
        "dna_epoch",
        "dna_isValidationReady",
        "dna_wordsSeed",
        "dna_getBalance",
        "dna_version",
        "dna_signatureAddress",
        "dna_sendToIpfs",
        "dna_globalState",
        "flip_getRaw",
        "flip_getKeys",
        "flip_words",
        "flip_shortHashes",
        "flip_longHashes",
        "flip_privateEncryptionKeyCandidates",
        "flip_sendPrivateEncryptionKeysPackage",
        "flip_sendPublicEncryptionKey",
        "flip_wordPairs",
        "flip_rawSubmit",
        "bcn_lastBlock",
        "bcn_blockAt",
        "bcn_block",
        "bcn_transaction",
        "bcn_txReceipt",
        "bcn_syncing",
        "bcn_feePerGas",
        "bcn_getRawTx",
        "bcn_sendRawTx",
        "bcn_estimateRawTx",
        "bcn_burntCoins",
        "bcn_keyWord",
        "ipfs_cid",
        "ipfs_get",
        "contract_getStake",
        "contract_readData",
        "contract_readonlyCall",
        "contract_readMap",
        "contract_iterateMap"
    ]
}
```

### Remote keys
You can use `remoteKeys` parameter to update the list of api keys from a specific URL automatically.
Example:
```
    "remoteKeys": {
        "enabled": true,
        "url": "http://localhost:1234/my-api-keys",
        "authorization": null,
        "interval": 300000
    },
```

The node will call the `url` at the specific intervals defined in the `interval` parameter in milliseconds.
The URL has to provide json response with array of keys as follows:
```
["key1", "key2", "keyN"]
```
Use `authorization` parameter with authorization header if needed.


## Old .env configuration

You can use these environmental variables to configure proxy. Better to use `config.json` file instead.
```
PORT=<proxy port>
IDENA_URL=<idena node url>
IDENA_KEY=<idena node api key>
AVAILABLE_KEYS=[<available static api keys here>]
LOGS_OUTPUT=<file|stdout>
GOD_API_KEY=<unlimited api key>
REMOTE_KEYS_ENABLED=<0|1>
REMOTE_KEYS_URL=<url to fetch remote api keys (replaces static keys)>
REMOTE_KEYS_AUTH=<auth header for fetching query>
```
