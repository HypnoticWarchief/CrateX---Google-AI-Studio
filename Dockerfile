# Stage 1: Build the React application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# CRITICAL: This runs npm install. 
# Ensure your package.json has "@google/generative-ai" instead of "@google/genai"
RUN npm install

# Pass the API key as a build argument
ARG GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy build files from the first stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Cloud Run expects port 8080
EXPOSE 8080

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
