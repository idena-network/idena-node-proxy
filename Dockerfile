FROM node:16-alpine

RUN npm install pm2 -g

RUN mkdir -p /home/node/app/node_modules

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["pm2-runtime", "start", "ecosystem.config.js"]