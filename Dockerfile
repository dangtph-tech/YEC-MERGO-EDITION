FROM node:20-slim

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Start the application
CMD ["npm", "start"]
