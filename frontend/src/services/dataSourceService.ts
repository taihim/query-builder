import { DataSource, DataSourceType } from '../types/dataSource';

const API_BASE_URL = import.meta.env.VITE_API_URL;
export const getDataSources = async (): Promise<DataSource[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/datasources`);
    
    if (!response.ok) {
      throw new Error(`Error fetching data sources: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map((source: any) => ({
      id: source.id.toString(),
      name: source.name,
      type: source.type as DataSourceType,
      host: source.host,
      port: source.port,
      database: source.database_name,
      username: source.username,
      created_at: source.created_at
    }));
  } catch (error) {
    console.error('Error in getDataSources:', error);
    throw error;
  }
};

export const addDataSource = async (
  name: string, 
  type: DataSourceType, 
  host: string, 
  port: string, 
  database: string,
  username: string,
  password: string
): Promise<DataSource> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/datasources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        type,
        host,
        port: Number(port),
        database_name: database,
        username,
        password
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.id.toString(),
      name: data.name,
      type: data.type as DataSourceType,
      host: data.host,
      port: data.port,
      database: data.database_name,
      username: data.username,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in addDataSource:', error);
    throw error;
  }
};

export const deleteDataSource = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dataSources/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete data source');
    }
  } catch (error) {
    console.error('Error deleting data source:', error);
    throw error;
  }
};

export const updateDataSource = async (
  id: string,
  name: string,
  type: DataSourceType,
  host: string,
  port: string,
  database_name: string,
  username: string,
  password: string
): Promise<DataSource> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/datasources/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        type,
        host,
        port,
        database_name,
        username,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update data source');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating data source:', error);
    throw error;
  }
};

export const testDataSourceConnection = async (
  type: DataSourceType,
  host: string,
  port: string,
  database_name: string,
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/datasources/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        host,
        port,
        database_name,
        username,
        password
      })
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error testing connection:', error);
    return false;
  }
}; 