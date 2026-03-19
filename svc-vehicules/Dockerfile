# ══════════════════════════════
# STAGE 1 : BUILD
# ══════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# On copie package.json EN PREMIER pour profiter du cache Docker
COPY package*.json ./
RUN npm ci

COPY . .

# ══════════════════════════════
# STAGE 2 : PRODUCTION
# ══════════════════════════════
FROM node:20-alpine

WORKDIR /app

# Sécurité : user non-root (obligatoire pour l'évaluation)
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001

# Copier uniquement le nécessaire depuis le stage builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src         ./src
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/app.js"]
