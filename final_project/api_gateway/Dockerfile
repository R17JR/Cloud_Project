# Use the official Nginx image as the base image
FROM nginx:latest

# Copy the custom Nginx configuration to the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for incoming traffic
EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
