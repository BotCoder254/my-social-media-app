# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Add necessary build tools
RUN apk add --no-cache python3 make g++ bash

# Set build arguments for environment variables
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_DATABASE_URL
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID

# Set environment variables
ENV REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY
ENV REACT_APP_FIREBASE_AUTH_DOMAIN=$REACT_APP_FIREBASE_AUTH_DOMAIN
ENV REACT_APP_FIREBASE_DATABASE_URL=$REACT_APP_FIREBASE_DATABASE_URL
ENV REACT_APP_FIREBASE_PROJECT_ID=$REACT_APP_FIREBASE_PROJECT_ID
ENV REACT_APP_FIREBASE_STORAGE_BUCKET=$REACT_APP_FIREBASE_STORAGE_BUCKET
ENV REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ENV REACT_APP_FIREBASE_APP_ID=$REACT_APP_FIREBASE_APP_ID

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Create env file at build time
RUN printf "REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY\n\
REACT_APP_FIREBASE_AUTH_DOMAIN=$REACT_APP_FIREBASE_AUTH_DOMAIN\n\
REACT_APP_FIREBASE_DATABASE_URL=$REACT_APP_FIREBASE_DATABASE_URL\n\
REACT_APP_FIREBASE_PROJECT_ID=$REACT_APP_FIREBASE_PROJECT_ID\n\
REACT_APP_FIREBASE_STORAGE_BUCKET=$REACT_APP_FIREBASE_STORAGE_BUCKET\n\
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$REACT_APP_FIREBASE_MESSAGING_SENDER_ID\n\
REACT_APP_FIREBASE_APP_ID=$REACT_APP_FIREBASE_APP_ID" > .env.production

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Install bash and curl for health checks
RUN apk add --no-cache bash curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create runtime environment variable script
RUN echo '#!/bin/bash\n\
\n\
# Create runtime config\n\
cat <<EOF > /usr/share/nginx/html/runtime-config.js\n\
window.REACT_APP_FIREBASE_API_KEY="$REACT_APP_FIREBASE_API_KEY";\n\
window.REACT_APP_FIREBASE_AUTH_DOMAIN="$REACT_APP_FIREBASE_AUTH_DOMAIN";\n\
window.REACT_APP_FIREBASE_DATABASE_URL="$REACT_APP_FIREBASE_DATABASE_URL";\n\
window.REACT_APP_FIREBASE_PROJECT_ID="$REACT_APP_FIREBASE_PROJECT_ID";\n\
window.REACT_APP_FIREBASE_STORAGE_BUCKET="$REACT_APP_FIREBASE_STORAGE_BUCKET";\n\
window.REACT_APP_FIREBASE_MESSAGING_SENDER_ID="$REACT_APP_FIREBASE_MESSAGING_SENDER_ID";\n\
window.REACT_APP_FIREBASE_APP_ID="$REACT_APP_FIREBASE_APP_ID";\n\
EOF\n\
\n\
# Start nginx\n\
nginx -g "daemon off;"' > /docker-entrypoint.sh \
&& chmod +x /docker-entrypoint.sh

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx with runtime config
CMD ["/docker-entrypoint.sh"]
