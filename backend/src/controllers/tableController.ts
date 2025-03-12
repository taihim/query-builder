import { Request, Response } from 'express';
import { TableModel } from '../models/tableModel';

export class TableController {
  /**
   * Get all tables for a data source
   */
  static async getTablesForDataSource(req: Request, res: Response): Promise<void> {
    const { dataSourceId } = req.params;
    
    try {
      const tables = await TableModel.getTablesForDataSource(dataSourceId);
      res.json(tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      
      if ((error as Error).message === 'Data source not found') {
        res.status(404).json({ error: 'Data source not found' });
      } else {
        res.status(500).json({ error: `Failed to fetch tables: ${(error as Error).message}` });
      }
    }
  }
} 