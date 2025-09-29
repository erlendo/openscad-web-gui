# Dockerfile for OpenSCAD Web UI
# 1. Bygg appen
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. (Valgfritt) Installer OpenSCAD CLI
FROM debian:bookworm-slim AS openscad
RUN apt-get update && \
    apt-get install -y openscad && \
    rm -rf /var/lib/apt/lists/*

# 3. Server statiske filer med nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=openscad /usr/bin/openscad /usr/bin/openscad
COPY ./nginx.conf /etc/nginx/nginx.conf

# 4. Helse-sjekk og rutine for oppdatering
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost || exit 1

# Oppdateringsrutine: Bruk GitHub Actions eller cron for rebuild
# Se README for detaljer

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
