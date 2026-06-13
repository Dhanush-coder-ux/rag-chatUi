# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using npm ci for more reliable builds
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]