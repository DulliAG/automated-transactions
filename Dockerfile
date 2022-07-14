FROM node:alpine

LABEL org.opencontainers.image.source https://github.com/tklein1801/automated-transactions

WORKDIR /usr/src/automated-transactions/

COPY package*.json ./

RUN --mount=type=secret,id=npm,target=.npmrc npm install

COPY . .

RUN npm run build

CMD ["node", "dist/index.js"]