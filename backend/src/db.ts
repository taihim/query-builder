import mysql, { Pool, Connection, RowDataPacket } from 'mysql2/promise';

// Define data source interface
export interface DataSource {
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
}

// Create connection pool to the application database
const appPool: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'querytool',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to create a connection to a user-defined data source
async function createDataSourceConnection(dataSource: DataSource): Promise<Connection> {
  try {
    return await mysql.createConnection({
      host: dataSource.host,
      port: Number(dataSource.port),
      user: dataSource.username,
      password: dataSource.password,
      database: dataSource.database_name
    });
  } catch (error) {
    console.error(`Failed to connect to data source: ${(error as Error).message}`);
    throw new Error(`Database connection failed: ${(error as Error).message}`);
  }
}

export {
  appPool,
  createDataSourceConnection
}; 