# Stage 1: Build the React application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Pass the API key as a build argument and write to .env.local
# NOTE: In a production web app, it's safer to use a backend proxy for API keys.
ARG GEMINI_API_KEY
RUN echo "VITE_GEMINI_API_KEY=$GEMINI_API_KEY" > .env.local

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the build output from the first stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 8080 for Google Cloud Run
EXPOSE 8080

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
