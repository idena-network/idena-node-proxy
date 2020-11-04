module.exports = {
  apps: [
    {
      name: 'idena-node-proxy',
      instances: 'max',
      exec_mode: 'cluster',
      script: './index.js',
    },
  ],
};
