# Stage 1: Build the React application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# RUN npm install will now succeed since package.json uses @google/generative-ai
RUN npm install

# Pass the API key as a build argument
ARG GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY

# Copy all source files and build the production bundle
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy your custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the build output from the first stage to Nginx's serving directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Cloud Run defaults to port 8080
EXPOSE 8080

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
