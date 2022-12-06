FROM rust:1.65 as builder

WORKDIR /app
COPY . packages/serverless/.env ./

WORKDIR /app/packages/serverless
RUN cargo build --release

# TODO: use a smaller image
FROM rust:1.65

COPY --from=builder /app/target/release/lagon-serverless /usr/local/bin/lagon-serverless

# Serverless
EXPOSE 4000
# Prometheus
EXPOSE 9000

CMD ["lagon-serverless"]
