FROM node:16-slim as builder

RUN apt update
RUN apt install -y python3 make g++ openssl

RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/runtime/package.json ./packages/runtime/package.json
COPY packages/serverless/package.json ./packages/serverless/package.json
COPY packages/prisma/package.json ./packages/prisma/package.json

RUN pnpm install --frozen-lockfile

COPY packages/runtime/ ./packages/runtime/
COPY packages/serverless/ ./packages/serverless/
COPY packages/prisma/ ./packages/prisma/

WORKDIR /app/packages/runtime
RUN pnpm build
RUN pnpm build:runtime

WORKDIR /app/packages/prisma
RUN pnpm prisma generate

WORKDIR /app/packages/serverless
RUN pnpm build

EXPOSE 4000
ENV NODE_ENV=production
CMD [ "pnpm", "start" ]
