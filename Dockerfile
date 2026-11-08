FROM node:22-alpine AS compilacao

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma7.config.ts tsconfig.json ./
COPY src ./src
RUN npm run prisma:generate && npm run build

FROM node:22-alpine AS aplicacao

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV OPEN_SWAGGER=false

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=compilacao /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
