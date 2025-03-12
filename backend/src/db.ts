import mysql, { Pool, Connection as MySQLConnection } from 'mysql2/promise';
import * as mssql from 'mssql';

// Base DataSource interface with all common properties
export interface DataSource {
  id?: number;
  name: string;
  type: 'mysql' | 'mssql';
  host: string;
  port: number;
  database_name: string;
  username: string;
  password?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Create a unified connection interface that both MySQL and MSSQL can implement
export interface DatabaseConnection {
  query: (sql: string, values?: any[]) => Promise<[any[], any]>;
  ping: () => Promise<void>;
  end: () => Promise<void>;
}

// MySQL connection adapter
class MySQLConnectionAdapter implements DatabaseConnection {
  private connection: MySQLConnection;

  constructor(connection: MySQLConnection) {
    this.connection = connection;
  }

  async query(sql: string, values?: any[]): Promise<[any[], any]> {
    return this.connection.query(sql, values);
  }

  async ping(): Promise<void> {
    await this.connection.ping();
  }

  async end(): Promise<void> {
    await this.connection.end();
  }
}

// MSSQL connection adapter
class MSSQLConnectionAdapter implements DatabaseConnection {
  private pool: mssql.ConnectionPool;

  constructor(pool: mssql.ConnectionPool) {
    this.pool = pool;
  }

  async query(sql: string, values?: any[]): Promise<[any[], any]> {
    if (values && values.length > 0) {
      // Create a new request
      const request = new mssql.Request(this.pool);
      
      // Replace all instances of ? with @p1, @p2, etc. and add inputs
      let paramIndex = 0;
      let parameterizedSql = sql;
      
      // Replace all ? with named parameters
      while (parameterizedSql.includes('?') && paramIndex < values.length) {
        const paramName = `@p${paramIndex + 1}`;
        // Find first ? and replace it
        const pos = parameterizedSql.indexOf('?');
        parameterizedSql = 
          parameterizedSql.substring(0, pos) + 
          paramName + 
          parameterizedSql.substring(pos + 1);
        
        // Add parameter value
        request.input(paramName, values[paramIndex]);
        paramIndex++;
      }
      
      console.log("MSSQL Query:", parameterizedSql, "Values:", values);
      
      const result = await request.query(parameterizedSql);
      return [result.recordset, result];
    } else {
      const result = await this.pool.request().query(sql);
      return [result.recordset, result];
    }
  }

  async ping(): Promise<void> {
    await this.pool.request().query('SELECT 1');
  }

  async end(): Promise<void> {
    await this.pool.close();
  }
}

// Create connection pool to the application database (MySQL for now)
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
export async function createDataSourceConnection(dataSource: DataSource): Promise<DatabaseConnection> {
  // Ensure password is provided, use empty string as fallback if undefined
  const password = dataSource.password ?? '';
  
  try {
    if (dataSource.type === 'mssql') {
      // MSSQL connection
      const config: mssql.config = {
        user: dataSource.username,
        password: password,
        server: dataSource.host,
        port: Number(dataSource.port),
        database: dataSource.database_name,
        options: {
          encrypt: true, 
          trustServerCertificate: true,
        },
        connectionTimeout: 30000,
        requestTimeout: 30000,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        }
      };
      
      const pool = await new mssql.ConnectionPool(config).connect();
      return new MSSQLConnectionAdapter(pool);
    } else {
      // MySQL connection (default)
      const connection = await mysql.createConnection({
        host: dataSource.host,
        port: Number(dataSource.port),
        user: dataSource.username,
        password: password,
        database: dataSource.database_name
      });
      return new MySQLConnectionAdapter(connection);
    }
  } catch (error) {
    console.error(`Failed to connect to data source: ${(error as Error).message}`);
    throw new Error(`Database connection failed: ${(error as Error).message}`);
  }
}

export {
  appPool,
}; 