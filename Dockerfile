# ==============================================================================
# CORDANO PMS — Dockerfile de Producción Multi-Stage para Google Cloud Run
# ==============================================================================
# Diseñado para portabilidad total y traspaso de propiedad a cuenta de cliente.
# - Etapa 1 (builder): Compila TypeScript y empaqueta assets con Vite.
# - Etapa 2 (runner): Contenedor ultraligero y seguro que sólo contiene dist/ y serve.
# ==============================================================================

# ── ETAPA 1: Construcción ──
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline || npm install

COPY . .
RUN npm run build

# ── ETAPA 2: Runtime de Producción Cloud Run ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Instalar servidor estático liviano y limpiar caché
RUN npm install -g serve && npm cache clean --force

# Copiar exclusivamente los artefactos compilados (incluyendo dist/serve.json)
COPY --from=builder /app/dist ./dist

# Puerto estándar para Cloud Run
EXPOSE 8080

# Servidor estático con soporte SPA y control estricto de caché
CMD ["serve", "-s", "dist", "-l", "8080"]
