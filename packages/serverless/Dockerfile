FROM node:alpine as builder

RUN apk add python3 make g++

RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install  --frozen-lockfile

COPY . .
RUN pnpm build

CMD [ "pnpm", "start" ]