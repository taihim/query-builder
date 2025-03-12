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
      const columnsString = columns.map(col => {
        const colName = typeof col === 'string' ? col : col.name;
        return dataSource.type === 'mssql' ? 
          `[${tableName}].[${colName}]` : 
          `${tableName}.${colName}`;
      }).join(', ');
      
      // Build query and params
      let query = `SELECT ${columnsString} FROM `;
      
      // Add table name with appropriate quoting
      if (dataSource.type === 'mssql') {
        query += `[${tableName}]`;
      } else {
        query += `${tableName}`;
      }
      
      const queryParams: any[] = [];
      
      // Add filters
      const filterClauses: string[] = [];
      
      Object.entries(filters).forEach(([column, filter]) => {
        if (filter.value) {
          const columnRef = dataSource.type === 'mssql' ? 
            `[${tableName}].[${column}]` : 
            `${tableName}.${column}`;
            
          switch (filter.operator) {
            case 'equals':
              filterClauses.push(`${columnRef} = ?`);
              queryParams.push(filter.value);
              break;
            case 'contains':
              if (dataSource.type === 'mssql') {
                filterClauses.push(`${columnRef} LIKE ?`);
                queryParams.push(`%${filter.value}%`);
              } else {
                filterClauses.push(`${columnRef} LIKE ?`);
                queryParams.push(`%${filter.value}%`);
              }
              break;
            case 'startsWith':
              filterClauses.push(`${columnRef} LIKE ?`);
              queryParams.push(`${filter.value}%`);
              break;
            case 'endsWith':
              filterClauses.push(`${columnRef} LIKE ?`);
              queryParams.push(`%${filter.value}`);
              break;
            case 'greaterThan':
              filterClauses.push(`${columnRef} > ?`);
              queryParams.push(filter.value);
              break;
            case 'lessThan':
              filterClauses.push(`${columnRef} < ?`);
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
        const columnRef = dataSource.type === 'mssql' ? 
          `[${tableName}].[${sortColumn}]` : 
          `${tableName}.${sortColumn}`;
        query += ` ORDER BY ${columnRef} ${sortDirection}`;
      } else if (dataSource.type === 'mssql' && !noLimit) {
        // MSSQL requires ORDER BY for OFFSET/FETCH
        const firstColumn = typeof columns[0] === 'string' ? columns[0] : columns[0].name;
        const columnRef = `[${tableName}].[${firstColumn}]`;
        query += ` ORDER BY ${columnRef}`;
      }
      
      // Get total count for pagination
      let countQuery: string;
      
      if (dataSource.type === 'mssql') {
        countQuery = `SELECT COUNT(*) AS total FROM [${tableName}]`;
      } else {
        countQuery = `SELECT COUNT(*) AS total FROM ${tableName}`;
      }
      
      if (filterClauses.length > 0) {
        countQuery += ` WHERE ${filterClauses.join(' AND ')}`;
      }
      
      const [countResult] = await connection.query(countQuery, queryParams);
      const totalRows = (countResult[0] as any).total;
      
      // Add pagination
      if (!noLimit) {
        if (dataSource.type === 'mssql') {
          // MSSQL uses OFFSET/FETCH NEXT syntax
          query += ` OFFSET ${(page - 1) * pageSize} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
        } else {
          // MySQL uses LIMIT/OFFSET
          query += ` LIMIT ? OFFSET ?`;
          queryParams.push(pageSize, (page - 1) * pageSize);
        }
      }
      
      // Execute query
      const [rows] = await connection.query(query, queryParams);
      
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