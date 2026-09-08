FROM node:20-alpine

WORKDIR /app

# Copy package files first for better Docker cache
COPY package.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy all application files
COPY . .

# Create db directory
RUN mkdir -p /app/db

# Expose port
EXPOSE 3000

# Set production environment
ENV ENVIRONMENT=production
ENV PORT=3000

# Seed database on first start, then run server
CMD ["sh", "-c", "node db/seed.js && node server.js"]
