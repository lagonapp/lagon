FROM node:alpine as builder

RUN apk add python3 make g++ openssl

RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY packages/serverless/package.json ./packages/serverless/
RUN pnpm install --frozen-lockfile

COPY . .
WORKDIR /app/packages/serverless
RUN pnpm i
RUN pnpm build

CMD [ "pnpm", "start" ]