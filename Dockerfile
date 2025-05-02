# Use the official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy your application code
COPY . .

# Run node src/index.js in a loop, sleeping 60s between runs, continuing even on error
CMD sh -c 'while true; do node src/index.js || echo "src/index.js crashed, continuing..."; sleep 60; done'
