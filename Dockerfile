FROM node:18-alpine

RUN apk --no-cache add ffmpeg

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

CMD ["node", "index.js"]
