import { RowDataPacket } from 'mysql2';
import { createDataSourceConnection, DataSource } from '../db';
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
      if (dataSource.type === 'mssql') {
        return await this.getTablesForMSSQL(connection, dataSource);
      } else {
        // Default to MySQL
        return await this.getTablesForMySQL(connection, dataSource);
      }
    } finally {
      await connection.end();
    }
  }

  /**
   * Get tables for MySQL data source
   */
  private static async getTablesForMySQL(connection: any, dataSource: DataSource): Promise<Table[]> {
    // Get tables
    const [tables] = await connection.query(`
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
        const [columns] = await connection.query(`
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
          const [rowCountResult] = await connection.query(
            `SELECT COUNT(*) AS rowCount FROM \`${dataSource.database_name}\`.\`${table.name}\``
          );
          
          return {
            ...table,
            rowCount: (rowCountResult[0] as any)?.rowCount || 0,
            columns: columns.map((col: any) => ({
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
          const [rowCountResult] = await connection.query(`
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
            columns: columns.map((col: any) => ({
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
  }

  /**
   * Get tables for MSSQL data source
   */
  private static async getTablesForMSSQL(connection: any, dataSource: DataSource): Promise<Table[]> {
    // Get tables
    const [tables] = await connection.query(`
      SELECT 
        t.name AS name,
        s.name AS [schema]
      FROM 
        sys.tables t
      INNER JOIN 
        sys.schemas s ON t.schema_id = s.schema_id
      WHERE 
        s.name = 'dbo' -- Default schema, can be changed to match the database structure
      ORDER BY 
        t.name
    `);
    
    // Get column information for each table
    const tablesWithColumns = await Promise.all(
      tables.map(async (table: any) => {
        // For MSSQL, don't use parameterized query for OBJECT_ID since it causes issues
        // Use direct interpolation since table name comes from the database, not user input
        const [columns] = await connection.query(`
          SELECT 
            c.name AS name,
            t.name AS dataType,
            c.is_nullable AS nullable,
            CASE WHEN pk.column_id IS NOT NULL THEN 'PRI' ELSE '' END AS [key]
          FROM 
            sys.columns c
          INNER JOIN 
            sys.types t ON c.user_type_id = t.user_type_id
          LEFT JOIN 
            (
              SELECT 
                ic.column_id, 
                ic.object_id
              FROM 
                sys.index_columns ic
              INNER JOIN 
                sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
              WHERE 
                i.is_primary_key = 1
            ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
          WHERE 
            c.object_id = OBJECT_ID('${table.schema}.${table.name}')
          ORDER BY 
            c.column_id
        `);
        
        try {
          // Get accurate row count - no parameter needed
          const [rowCountResult] = await connection.query(
            `SELECT COUNT(*) AS [count] FROM [${table.schema}].[${table.name}]`
          );
          
          return {
            ...table,
            rowCount: rowCountResult[0]?.count || 0,
            columns: columns.map((col: any) => ({
              name: col.name,
              dataType: col.dataType,
              friendlyType: this.mapDataTypeToFriendlyType(col.dataType),
              nullable: col.nullable === 1,
              isPrimaryKey: col.key === 'PRI'
            }))
          };
        } catch (error) {
          console.warn(`Error getting row count for table ${table.name}:`, error);
          
          // For MSSQL, use sys.dm_db_partition_stats for approximate row count
          // Don't use parameterized query with OBJECT_ID
          const [rowCountResult] = await connection.query(`
            SELECT 
              SUM(p.rows) AS [count]
            FROM 
              sys.partitions p
            WHERE 
              p.object_id = OBJECT_ID('${table.schema}.${table.name}') AND
              p.index_id IN (0, 1)
          `);

          return {
            ...table,
            rowCount: rowCountResult[0]?.count || 0,
            columns: columns.map((col: any) => ({
              name: col.name,
              dataType: col.dataType,
              friendlyType: this.mapDataTypeToFriendlyType(col.dataType),
              nullable: col.nullable === 1,
              isPrimaryKey: col.key === 'PRI'
            }))
          };
        }
      })
    );
    
    return tablesWithColumns;
  }
  
  /**
   * Helper method to map SQL data types to friendly types
   */
  static mapDataTypeToFriendlyType(dataType: string): string {
    const typeMap: Record<string, string> = {
      // MySQL types
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
      'json': 'JSON',
      
      // MSSQL types
      'nvarchar': 'Text',
      'nchar': 'Text',
      'ntext': 'Long Text',
      'smallint': 'Number',
      'money': 'Currency',
      'smallmoney': 'Currency',
      'bit': 'Yes/No',
      'uniqueidentifier': 'Text',
      'smalldatetime': 'Date & Time',
      'datetimeoffset': 'Date & Time',
      'xml': 'Text'
    };
    
    for (const key in typeMap) {
      if (dataType.toLowerCase().includes(key)) {
        return typeMap[key];
      }
    }
    
    return 'Text'; // Default
  }
} 