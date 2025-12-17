FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY web/package.json web/package-lock.json ./
RUN npm ci --silent

# Copy sources
COPY web/ .

# Build Next.js
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm","start"]
