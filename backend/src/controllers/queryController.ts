import { Request, Response } from 'express';
import { QueryModel, QueryFilter } from '../models/queryModel';

export class QueryController {
  /**
   * Execute a query with POST request
   */
  static async executePostQuery(req: Request, res: Response): Promise<void> {
    const { dataSourceId, tableName, columns, page = 1, pageSize = 100 } = req.body;
    
    if (!dataSourceId || !tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
      res.status(400).json({ error: 'Invalid request parameters' });
      return;
    }
    
    try {
      const results = await QueryModel.executeQuery({
        dataSourceId,
        tableName,
        columns,
        page,
        pageSize
      });
      
      res.json({
        columns,
        rows: results.rows,
        pagination: {
          page: results.page,
          pageSize: results.pageSize,
          totalRows: results.totalRows,
          totalPages: results.totalPages
        }
      });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: `Query execution failed: ${(error as Error).message}` });
    }
  }

  /**
   * Execute a query with GET request
   */
  static async executeGetQuery(req: Request, res: Response): Promise<void> {
    try {
      const dataSourceId = Number(req.query.dataSourceId);
      const tableName = req.query.tableName as string;
      const noLimit = req.query.noLimit === 'true';
      const columns = Array.isArray(req.query.columns) 
        ? req.query.columns as string[] 
        : [req.query.columns as string];
      
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      
      const sortColumn = req.query.sortColumn as string;
      const sortDirection = req.query.sortDirection as 'asc' | 'desc';
      
      // Parse filters from query params
      const filters: Record<string, QueryFilter> = {};
      
      Object.keys(req.query).forEach(key => {
        if (key.startsWith('filter')) {
          const filterObj = req.query[key] as Record<string, any>;
          
          Object.keys(filterObj).forEach(columnName => {
            if (!filters[columnName]) {
              filters[columnName] = {
                value: filterObj[columnName].value as string,
                operator: filterObj[columnName].operator as any
              };
            }
          });
        }
      });
      
      const results = await QueryModel.executeQuery({
        dataSourceId,
        tableName,
        columns,
        page,
        pageSize,
        filters,
        sortColumn,
        sortDirection,
        noLimit
      });
      
      res.json(results);
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: `Failed to execute query: ${(error as Error).message}` });
    }
  }
} 