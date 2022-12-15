FROM node:19.3.0-buster-slim as runtime

WORKDIR /app
COPY ./packages/js-runtime/src/ ./src
COPY ./packages/js-runtime/package.json ./

RUN npm install --global esbuild
RUN npm install
RUN npm run build

FROM rust:1.66-buster as builder

WORKDIR /app
COPY . ./

WORKDIR /app/packages/serverless
COPY --from=runtime /app/dist/index.js /app/packages/js-runtime/dist/
RUN cargo build --release

FROM rust:1.66-slim-buster

COPY --from=builder /app/target/release/lagon-serverless /usr/local/bin/lagon-serverless

# Serverless
EXPOSE 4000
# Prometheus
EXPOSE 9000

CMD ["lagon-serverless"]
