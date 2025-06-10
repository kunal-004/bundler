FROM node:18-alpine

# Install Python, make, and build tools
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

EXPOSE 8080
WORKDIR /app

# Install backend dependencies
COPY ./package.json ./package-lock.json ./
RUN npm install

# Build frontend
COPY ./frontend /app/frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Copy backend source code (excluding frontend since it's already handled)
WORKDIR /app
COPY . .

# Run the backend server
CMD ["npm", "run", "start:prod"]