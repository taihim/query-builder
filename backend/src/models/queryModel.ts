import { RowDataPacket } from 'mysql2';
import { createDataSourceConnection } from '../db';
import { DataSourceModel } from './dataSourceModel';
import { Column } from './tableModel';

export interface QueryFilter {
  value: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
}

export interface QueryOptions {
  dataSourceId: number;
  tableName: string;
  columns: Column[] | string[];
  page?: number;
  pageSize?: number;
  filters?: Record<string, QueryFilter>;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  noLimit?: boolean;
}

export interface QueryResult {
  rows: any[];
  columns?: Column[];
  totalRows: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class QueryModel {
  /**
   * Execute a query with the given options
   */
  static async executeQuery(options: QueryOptions): Promise<QueryResult> {
    const {
      dataSourceId,
      tableName,
      columns,
      page = 1,
      pageSize = 100,
      filters = {},
      sortColumn,
      sortDirection,
      noLimit = false
    } = options;
    
    // Get data source
    const dataSource = await DataSourceModel.getDataSourceById(dataSourceId);
    
    if (!dataSource) {
      throw new Error('Data source not found');
    }
    
    // Connect to the data source
    const connection = await createDataSourceConnection(dataSource);
    
    try {
      // Prepare column names
      const columnNames = Array.isArray(columns) 
        ? columns.map(col => typeof col === 'string' ? col : col.name)
        : [columns];
      
      // Build query and params
      let query = `SELECT ${columnNames.join(', ')} FROM ${tableName}`;
      const queryParams: any[] = [];
      
      // Add filters
      const filterClauses: string[] = [];
      
      Object.entries(filters).forEach(([columnName, filter]) => {
        if (filter.value) {
          switch (filter.operator) {
            case 'equals':
              filterClauses.push(`${columnName} = ?`);
              queryParams.push(filter.value);
              break;
            case 'contains':
              filterClauses.push(`${columnName} LIKE ?`);
              queryParams.push(`%${filter.value}%`);
              break;
            case 'startsWith':
              filterClauses.push(`${columnName} LIKE ?`);
              queryParams.push(`${filter.value}%`);
              break;
            case 'endsWith':
              filterClauses.push(`${columnName} LIKE ?`);
              queryParams.push(`%${filter.value}`);
              break;
            case 'greaterThan':
              filterClauses.push(`${columnName} > ?`);
              queryParams.push(filter.value);
              break;
            case 'lessThan':
              filterClauses.push(`${columnName} < ?`);
              queryParams.push(filter.value);
              break;
          }
        }
      });

      if (filterClauses.length > 0) {
        query += ` WHERE ${filterClauses.join(' AND ')}`;
      }
      
      // Add sorting
      if (sortColumn && (sortDirection === 'asc' || sortDirection === 'desc')) {
        query += ` ORDER BY ${sortColumn} ${sortDirection.toUpperCase()}`;
      }
      
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) AS total FROM ${tableName}${
        query.includes('WHERE') ? ` WHERE ${query.split('WHERE')[1].split('ORDER BY')[0]}` : ''
      }`;
      
      const [countResult] = await connection.query<RowDataPacket[]>(countQuery, queryParams);
      const totalRows = (countResult[0] as RowDataPacket).total;
      
      // Add pagination
      if (!noLimit) {
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(pageSize, (page - 1) * pageSize);
      }
      
      // Execute query
      const [rows] = await connection.query<RowDataPacket[]>(query, queryParams);
      
      return {
        rows: rows as any[],
        totalRows: totalRows as number,
        page,
        pageSize,
        totalPages: Math.ceil(totalRows as number / pageSize)
      };
    } finally {
      await connection.end();
    }
  }
} 