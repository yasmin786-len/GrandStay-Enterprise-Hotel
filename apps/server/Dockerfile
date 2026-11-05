FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY apps/server apps/server
RUN npm run build -w apps/server

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --omit=dev -w apps/server
COPY --from=build /app/apps/server/dist apps/server/dist
EXPOSE 5000
CMD ["node", "apps/server/dist/index.js"]
