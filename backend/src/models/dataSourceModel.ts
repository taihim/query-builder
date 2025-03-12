import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { appPool } from '../db';

export interface DataSource {
  id?: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DataSourceCredentials {
  host: string;
  port: number | string;
  username: string;
  password: string;
  database_name: string;
}

export class DataSourceModel {
  /**
   * Get all data sources (sanitized, without passwords)
   */
  static async getAllDataSources(): Promise<DataSource[]> {
    const [rows] = await appPool.query<RowDataPacket[]>(
      'SELECT id, name, type, host, port, database_name, username, created_at FROM data_sources'
    );
    return rows as DataSource[];
  }

  /**
   * Get a data source by ID
   */
  static async getDataSourceById(id: number | string): Promise<DataSource | null> {
    const [rows] = await appPool.query<RowDataPacket[]>(
      'SELECT * FROM data_sources WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) return null;
    return rows[0] as DataSource;
  }

  /**
   * Create a new data source
   */
  static async createDataSource(dataSource: DataSource): Promise<DataSource> {
    const { name, type, host, port, database_name, username, password } = dataSource;
    
    const [result] = await appPool.query<ResultSetHeader>(
      'INSERT INTO data_sources (name, type, host, port, database_name, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, host, port, database_name, username, password]
    );
    
    return {
      id: result.insertId,
      name,
      type,
      host,
      port,
      database_name,
      username,
      created_at: new Date()
    };
  }

  /**
   * Update an existing data source
   */
  static async updateDataSource(id: number | string, dataSource: DataSource): Promise<DataSource | null> {
    const { name, type, host, port, database_name, username, password } = dataSource;
    
    await appPool.query(
      'UPDATE data_sources SET name = ?, type = ?, host = ?, port = ?, database_name = ?, username = ?, password = ? WHERE id = ?',
      [name, type, host, port, database_name, username, password, id]
    );
    
    return this.getDataSourceById(id);
  }

  /**
   * Delete a data source
   */
  static async deleteDataSource(id: number | string): Promise<boolean> {
    const [result] = await appPool.query<ResultSetHeader>(
      'DELETE FROM data_sources WHERE id = ?', 
      [id]
    );
    
    return result.affectedRows > 0;
  }
} 