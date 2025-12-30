# Stage 1: Build the React application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# CRITICAL: Ensure your package.json uses "@google/generative-ai" 
# to avoid the "notarget" error you encountered.
RUN npm install

# Pass the API key as a build argument
ARG GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY

# Copy the source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the static build files from the build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Google Cloud Run expects port 8080
EXPOSE 8080

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
