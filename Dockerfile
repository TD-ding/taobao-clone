FROM node:18-alpine

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Install client dependencies and build
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Copy server source
COPY server/ ./server/

# Create data and uploads directories
RUN mkdir -p /app/server/data /app/server/uploads

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/server.js"]
