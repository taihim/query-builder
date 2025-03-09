FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json ./
RUN pnpm install

# Copy source and build
COPY . .
RUN pnpm build

# Development/Production image
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./

# Install dependencies based on NODE_ENV
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "development" ] ; then pnpm install ; else pnpm install --prod ; fi

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Copy source for development (needed for ts-node-dev)
COPY ./src ./src

# Expose API port
EXPOSE 3000

# Default command uses the built files
CMD ["pnpm", "start"] 