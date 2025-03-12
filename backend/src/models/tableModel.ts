import { RowDataPacket } from 'mysql2';
import { createDataSourceConnection } from '../db';
import { DataSourceModel } from './dataSourceModel';

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

export class TableModel {
  /**
   * Get all tables and their columns for a data source
   */
  static async getTablesForDataSource(dataSourceId: number | string): Promise<Table[]> {
    // Get data source from the model
    const dataSource = await DataSourceModel.getDataSourceById(dataSourceId);
    
    if (!dataSource) {
      throw new Error('Data source not found');
    }
    
    // Connect to the data source
    const connection = await createDataSourceConnection(dataSource);
    
    try {
      // Get tables
      const [tables] = await connection.query<RowDataPacket[]>(`
        SELECT 
          table_name AS name,
          table_schema AS \`schema\`
        FROM 
          information_schema.tables 
        WHERE 
          table_schema = ?
        ORDER BY 
          table_name
      `, [dataSource.database_name]);
      
      // Get column information for each table
      const tablesWithColumns = await Promise.all(
        tables.map(async (table: any) => {
          const [columns] = await connection.query<RowDataPacket[]>(`
            SELECT 
              column_name AS name,
              data_type AS dataType,
              is_nullable AS nullable,
              column_key AS \`key\`
            FROM 
              information_schema.columns 
            WHERE 
              table_schema = ? AND 
              table_name = ?
            ORDER BY 
              ordinal_position
          `, [dataSource.database_name, table.name]);
          
          try {
            // Get accurate row count
            const [rowCountResult] = await connection.query<RowDataPacket[]>(
              `SELECT COUNT(*) AS rowCount FROM \`${dataSource.database_name}\`.\`${table.name}\``
            );
            
            return {
              ...table,
              rowCount: (rowCountResult[0] as any)?.rowCount || 0,
              columns: columns.map(col => ({
                name: col.name,
                dataType: col.dataType,
                friendlyType: this.mapDataTypeToFriendlyType(col.dataType),
                nullable: col.nullable === 'YES',
                isPrimaryKey: col.key === 'PRI'
              }))
            };
          } catch (error) {
            console.warn(`Error getting row count for table ${table.name}:`, error);
            
            // Fallback to the information_schema approach
            const [rowCountResult] = await connection.query<RowDataPacket[]>(`
              SELECT 
                table_rows AS rowCount
              FROM 
                information_schema.tables 
              WHERE 
                table_schema = ? AND 
                table_name = ?
            `, [dataSource.database_name, table.name]);

            return {
              ...table,
              rowCount: (rowCountResult[0] as any)?.rowCount || 0,
              columns: columns.map(col => ({
                name: col.name,
                dataType: col.dataType,
                friendlyType: this.mapDataTypeToFriendlyType(col.dataType),
                nullable: col.nullable === 'YES',
                isPrimaryKey: col.key === 'PRI'
              }))
            };
          }
        })
      );
      
      return tablesWithColumns;
    } finally {
      await connection.end();
    }
  }
  
  /**
   * Helper method to map SQL data types to friendly types
   */
  static mapDataTypeToFriendlyType(dataType: string): string {
    const typeMap: Record<string, string> = {
      'int': 'Number',
      'bigint': 'Number',
      'decimal': 'Currency',
      'float': 'Number',
      'double': 'Number',
      'varchar': 'Text',
      'char': 'Text',
      'text': 'Long Text',
      'datetime': 'Date & Time',
      'timestamp': 'Date & Time',
      'date': 'Date',
      'time': 'Time',
      'boolean': 'Yes/No',
      'tinyint': 'Yes/No',
      'enum': 'Text',
      'json': 'JSON'
    };
    
    for (const key in typeMap) {
      if (dataType.includes(key)) {
        return typeMap[key];
      }
    }
    
    return 'Text'; // Default
  }
} 