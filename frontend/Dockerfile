# --- Stage 1 : build Vite ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
# URLs injectées au build (valeurs dev par défaut, overridées en K8s)
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_GRAPHQL_URL=http://localhost:4000/graphql
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
COPY . .
RUN npm run build

# --- Stage 2 : nginx non-root ---
FROM nginx:1.27-alpine
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /usr/share/nginx/html
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html
COPY --chown=appuser:appgroup nginx.conf /etc/nginx/nginx.conf
USER appuser
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
