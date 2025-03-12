import { Request, Response } from 'express';
import { DataSourceModel } from '../models/dataSourceModel';
import { createDataSourceConnection } from '../db';

export class DataSourceController {
  /**
   * Get all data sources
   */
  static async getAllDataSources(req: Request, res: Response): Promise<void> {
    try {
      const dataSources = await DataSourceModel.getAllDataSources();
      res.json(dataSources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      res.status(500).json({ error: 'Failed to fetch data sources' });
    }
  }

  /**
   * Test a database connection
   */
  static async testConnection(req: Request, res: Response): Promise<void> {
    console.log('Test connection request received:', req.body);
    
    const { type, host, port, username, password, database_name } = req.body;
    
    if (!type || !host || !port || !username || !password || !database_name) {
      console.log('Invalid request parameters:', { type, host, port, username, password: '***', database_name });
      res.status(400).json({ success: false, message: 'Missing required connection parameters' });
      return;
    }
    
    try {
      const connection = await createDataSourceConnection({
        host, port, username, password, database_name
      });
      
      await connection.ping();
      await connection.end();
      
      res.json({ success: true, message: 'Connection successful!' });
    } catch (error) {
      console.error('Test connection error:', error);
      res.status(400).json({ 
        success: false, 
        message: `Connection failed: ${(error as Error).message}` 
      });
    }
  }

  /**
   * Create a new data source
   */
  static async createDataSource(req: Request, res: Response): Promise<void> {
    const { name, type, host, port, database_name, username, password } = req.body;
    
    // Validation
    if (!name || !type || !host || !port || !database_name || !username || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }
    
    try {
      // Test the connection first
      const connection = await createDataSourceConnection({
        host, port, username, password, database_name
      });
      await connection.end();
      
      // Create the data source
      const newDataSource = await DataSourceModel.createDataSource({
        name, type, host, port, database_name, username, password
      });
      
      res.status(201).json(newDataSource);
    } catch (error) {
      console.error('Error adding data source:', error);
      res.status(500).json({ error: `Failed to add data source: ${(error as Error).message}` });
    }
  }

  /**
   * Update a data source
   */
  static async updateDataSource(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, type, host, port, database_name, username, password } = req.body;
    
    // Validation
    if (!name || !type || !host || !port || !database_name || !username || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }
    
    try {
      // Check if data source exists
      const existingSource = await DataSourceModel.getDataSourceById(id);
      
      if (!existingSource) {
        // Create new data source
        const newDataSource = await DataSourceModel.createDataSource({
          name, type, host, port, database_name, username, password
        });
        
        res.status(201).json(newDataSource);
        return;
      }
      
      // Update existing data source
      const updatedDataSource = await DataSourceModel.updateDataSource(id, {
        name, type, host, port, database_name, username, password
      });
      
      res.json(updatedDataSource);
    } catch (error) {
      console.error('Error updating data source:', error);
      res.status(500).json({ error: `Failed to update data source: ${(error as Error).message}` });
    }
  }

  /**
   * Delete a data source
   */
  static async deleteDataSource(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    try {
      const success = await DataSourceModel.deleteDataSource(id);
      
      if (success) {
        res.status(200).json({ message: 'Data source deleted successfully' });
      } else {
        res.status(404).json({ error: 'Data source not found' });
      }
    } catch (error) {
      console.error('Error deleting data source:', error);
      res.status(500).json({ error: 'Failed to delete data source' });
    }
  }
} 