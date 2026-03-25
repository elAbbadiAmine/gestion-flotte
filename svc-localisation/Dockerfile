FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src         ./src
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3004/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "src/app.js"]
