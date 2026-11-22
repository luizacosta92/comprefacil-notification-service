FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npm run prisma:generate

FROM deps AS build
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm run prisma:generate
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["sh", "-c", "npm run prisma:migrate && node dist/main"]
