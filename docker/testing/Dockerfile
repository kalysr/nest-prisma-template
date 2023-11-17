FROM node:16.18.1-alpine

#For Apple silicon / arm64 machines
#FROM node:lts

RUN apk add git

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

CMD npx prisma migrate deploy && npm run test:e2e
