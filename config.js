require('dotenv-flow').config();

module.exports = {
  port: process.env.PORT || 3000,
  rateLimit: {
    windowMs: 1000,
    max: 10,
  },
  apiKeys: JSON.parse(process.env.AVAILABLE_KEYS || '[]'),
  node: {
    url: process.env.IDENA_URL,
    key: process.env.IDENA_KEY,
  },
  logs: {
    output: process.env.LOGS_OUTPUT,
    format:
      ':date[iso] - :apiKey - :status - :response-time ms - :body - :res[content-length]',
    file: 'access.log',
  },
  methods: [
    'dna_identity',
    'dna_ceremonyIntervals',
    'dna_epoch',
    'dna_isValidationReady',
    'dna_wordsSeed',
    'dna_getBalance',
    'flip_getRaw',
    'flip_getKeys',
    'flip_words',
    'flip_shortHashes',
    'flip_longHashes',
    'flip_privateEncryptionKeyCandidates',
    'flip_sendPrivateEncryptionKeysPackage',
    'flip_sendPublicEncryptionKey',
    'flip_wordPairs',
    'flip_rawSubmit',
    'bcn_syncing',
    'bcn_getRawTx',
    'bcn_sendRawTx',
    'bcn_transaction',
    'ipfs_cid',
  ],
};
