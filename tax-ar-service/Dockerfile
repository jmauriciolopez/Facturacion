# --- Stage 1: Base & Dependencies ---
FROM node:20-bookworm-slim AS base

# Definir variables de entorno para Puppeteer y NestJS
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    NODE_ENV=production

# Instalar dependencias del sistema necesarias para Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libcups2 \
    libxss1 \
    libdbus-1-3 \
    libatk1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Stage 2: Builder ---
FROM base AS builder

# Instalar dependencias de desarrollo necesarias para el build
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --include=dev

# Copiar el código fuente y compilar
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Stage 3: Production ---
FROM base AS production

# Copiar solo archivos necesarios
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Exponer el puerto de NestJS
EXPOSE 3000

# Usuario no root por seguridad (opcional, pero Puppeteer requiere --no-sandbox si corre como root)
# Por simplicidad en este microservicio interno, correremos como root con --no-sandbox en el código del servicio.

CMD ["npm", "run", "start:prod"]
