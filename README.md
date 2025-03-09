# queryBuilder
Frontend and backend monorepo for queryBuilder app

## Quick Start

### Running with Docker (Recommended)

1. **Prerequisites:**
   - Docker and Docker Compose installed on your system
   - A .env file in the root of the project with the following variables:
     - MYSQL_ROOT_PASSWORD
     - MYSQL_DATABASE
     - MYSQL_USER
     - MYSQL_PASSWORD
     - MYSQL_HOST
     - MYSQL_PORT

     # Backend Configuration
     - NODE_ENV
     - DB_HOST
     - DB_PORT
     - DB_USER
     - DB_PASSWORD

     # Frontend Configuration
     - VITE_API_URL

   A sample .env file is provided in the root of the project.


2. **Start the application:**
   ```bash
   # Clone the repository
   git clone https://github.com/taihim/queryBuilder.git
   cd query-builder

   # Start all services
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - API: http://localhost:3000
   - MySQL Database: localhost:3306 (username: admin, password: admin123)

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Development Setup

If you prefer to run the applications locally:

1. **Start MySQL:**
   - Either use the Docker container: `docker-compose up mysql -d`
   - Or install MySQL locally and run the init scripts in `mysql/init`

2. **Start the backend:**
   ```bash
   cd backend
   pnpm install
   pnpm start
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   pnpm install
   pnpm start
   ```

## Project Structure

- **frontend:** React application with UI for data exploration
- **backend:** API server that connects to the database
- **mysql:** Database with sample data
