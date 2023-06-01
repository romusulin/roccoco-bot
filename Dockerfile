FROM node:18-alpine

WORKDIR /app

RUN apk upgrade -U
RUN apk add libtool libsodium python3 make autoconf automake alpine-sdk bash

COPY . .

RUN npm install
RUN npm run build

ENTRYPOINT ["node", "./src/app.js"]