# Use official Node.js base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application code
COPY . .

# Expose the port your service runs on (adjust if different)
EXPOSE 4000

# Start the application
CMD ["node", "appointment-service.js"]
