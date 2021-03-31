# Idena node proxy

Install all dependencies
`npm i`

Start the local server
`npm run dev`

## Run as Docker

You can build your own docker file or get image from `idena/node-proxy:latest`   

## Configuration

To configure proxy you can use `config.json` file or set custom path with `CONFIG_PATH` environmental variable.

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
        "bcn_syncing",
        "bcn_getRawTx",
        "bcn_sendRawTx",
        "bcn_transaction",
        "ipfs_cid"
    ]
}
```

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