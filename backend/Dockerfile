# ---- build stage ----
FROM golang:1.26-alpine AS build

WORKDIR /src

# Cache deps first
COPY go.mod go.sum ./
RUN go mod download

# Build a static binary (pgx is pure Go, so CGO can stay off)
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server .

# ---- runtime stage ----
FROM alpine:3.20

# ca-certificates is needed for TLS to Supabase (JWKS fetch + Postgres)
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=build /out/server /app/server

# Default port; hosts (Render/Fly/Railway) may override via $PORT
ENV PORT=8080
EXPOSE 8080

CMD ["/app/server"]
