FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8787
VOLUME ["/data"]
CMD ["/app/docker-entrypoint.sh"]
