# Stage 1: Build the React application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Standard install - ensure package.json uses @google/generative-ai
RUN npm install

# Pass the Gemini API key as a build argument
ARG GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy build files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Cloud Run expected port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
