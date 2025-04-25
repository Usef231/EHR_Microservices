# Use an official Node.js runtime as the base image
FROM node:16-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the app will run on
EXPOSE 5050

# Command to run the app
CMD ["node", "medical-records-service.js"]
