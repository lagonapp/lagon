FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM node:19.7.0-bullseye-slim as js-runtime
WORKDIR /app
COPY ./packages/js-runtime/src/ ./src
COPY ./packages/js-runtime/package.json ./
RUN npm install --global esbuild
RUN npm install
RUN npm run build

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
COPY --from=js-runtime /app/dist/index.js /app/crates/js-runtime/dist
RUN cargo build --release --bin lagon-serverless

FROM debian:bullseye-slim AS runtime
WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y ca-certificates \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/lagon-serverless /usr/local/bin

ENTRYPOINT ["/usr/local/bin/lagon-serverless"]
