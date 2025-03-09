// import { DatabaseTable } from '../types/dataSource';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Column {
  name: string;
  dataType: string;
  friendlyType: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface Table {
  name: string;
  schema: string;
  rowCount: number;
  columns: Column[];
}

export const getTablesForDataSource = async (dataSourceId: number): Promise<Table[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tables/${dataSourceId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch tables');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
}; 