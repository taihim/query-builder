// import { TableColumn } from '../types/dataSource';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Column {
  name: string;
  dataType: string;
  friendlyType: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
}

export interface QueryResult {
  columns: Column[];
  rows: any[];
  pagination: PaginationInfo;
}

export const executeQuery = async (
  dataSourceId: number, 
  tableName: string, 
  columns: Column[],
  page: number = 1,
  pageSize: number = 100
): Promise<QueryResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataSourceId,
        tableName,
        columns,
        page,
        pageSize
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to execute query');
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

export const executeQueryWithPagination = async (
  dataSourceId: number,
  tableName: string,
  columns: Column[],
  page: number = 1,
  pageSize: number = 10,
  sortConfig: { column: string; direction: 'asc' | 'desc' } | null = null,
  filters: Record<string, { value: string; operator: string }> = {}
): Promise<{ rows: Record<string, any>[]; totalRows: number }> => {
  try {
    const params = new URLSearchParams({
      dataSourceId: dataSourceId.toString(),
      tableName,
      page: page.toString(),
      pageSize: pageSize.toString(),
      noLimit: 'false'
    });

    columns.forEach(col => {
      params.append('columns', col.name);
    });

    if (sortConfig) {
      params.append('sortColumn', sortConfig.column);
      params.append('sortDirection', sortConfig.direction);
    }

    for (const [column, filter] of Object.entries(filters)) {
      if (filter.value) {
        params.append(`filter[${column}][value]`, filter.value);
        params.append(`filter[${column}][operator]`, filter.operator);
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/query?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to execute query');
    }
    
    const data = await response.json();
    return {
      rows: data.rows,
      totalRows: data.totalRows
    };
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

export const executeQueryForVisualization = async (
  dataSourceId: number, 
  tableName: string, 
  columns: string[],
  filters?: Record<string, { value: string; operator: string }>,
  sortColumn?: string,
  sortDirection?: 'asc' | 'desc'
): Promise<{ rows: Record<string, any>[] }> => {
  try {
    const params = new URLSearchParams({
      dataSourceId: dataSourceId.toString(),
      tableName,
      noLimit: 'true'
    });
    
    columns.forEach(col => {
      params.append('columns', col);
    });
    
    if (sortColumn) {
      params.append('sortColumn', sortColumn);
      if (sortDirection) {
        params.append('sortDirection', sortDirection);
      }
    }
    
    if (filters) {
      for (const [column, filter] of Object.entries(filters)) {
        if (filter.value) {
          params.append(`filter[${column}][value]`, filter.value);
          params.append(`filter[${column}][operator]`, filter.operator);
        }
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/api/query?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error executing visualization query:', error);
    throw error;
  }
}; 