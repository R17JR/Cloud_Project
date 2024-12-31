# Use the official Node.js 20 image as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files and install dependencies in one step to leverage caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5001

# Disable colored logging for cleaner output
ENV FORCE_COLOR=0

# Define the command to run the application
CMD ["node", "server.js"]
