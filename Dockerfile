# Lab 5: Dockerfile for Student REST API
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install application dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose Student API port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
