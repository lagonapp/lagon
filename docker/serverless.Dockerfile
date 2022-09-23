FROM rust:1.63 as builder

WORKDIR /app
COPY . .

WORKDIR /app/packages/serverless
RUN cargo build --release

# TODO: use a smaller image
FROM rust:1.63

COPY --from=builder /app/target/release/lagon-serverless /usr/local/bin/lagon-serverless

EXPOSE 4000
CMD ["lagon-serverless"]
