FROM node:22-alpine AS compilacao

WORKDIR /app

ARG VITE_API_URL=http://127.0.0.1:3000
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY tailwind.config.cjs postcss.config.cjs ./
COPY src ./src
RUN npm run build

FROM nginx:alpine AS aplicacao

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacao /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
