FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["node", "--import", "./node_modules/dotenv/config", "node_modules/.bin/tsx", "src/server.ts"]
