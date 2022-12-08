FROM node:18.12.1-buster-slim as runtime

WORKDIR /app
COPY ./packages/js-runtime/src/ ./src
COPY ./packages/js-runtime/package.json ./

RUN npm install --global esbuild
RUN npm install
RUN npm run build

FROM rust:1.65-buster as builder

WORKDIR /app
RUN mkdir ./packages
COPY ./Cargo.toml ./
COPY ./packages/cli/ ./packages/cli
COPY ./packages/wpt-runner/ ./packages/wpt-runner
COPY ./packages/runtime/ ./packages/runtime
COPY ./packages/serverless/ ./packages/serverless

WORKDIR /app/packages/serverless
COPY --from=runtime /app/dist/index.js /app/packages/js-runtime/dist/
RUN cargo build --release

FROM rust:1.65-slim-buster

COPY --from=builder /app/target/release/lagon-serverless /usr/local/bin/lagon-serverless

# Serverless
EXPOSE 4000
# Prometheus
EXPOSE 9000

CMD ["lagon-serverless"]
