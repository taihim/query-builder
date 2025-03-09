import express, { Request, Response } from 'express';
import { appPool, createDataSourceConnection } from '../db';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

interface ColumnInfo extends RowDataPacket {
  name: string;
  dataType: string;
  nullable: string;
  key: string;
}

// Get tables for a data source
router.get('/:dataSourceId', async (req: Request, res: Response) => {
  const { dataSourceId } = req.params;
  
  try {
    // Get data source details
    const [dataSources] = await appPool.query<RowDataPacket[]>('SELECT * FROM data_sources WHERE id = ?', [dataSourceId]);
    
    if (dataSources.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    const dataSource = dataSources[0] as any;
    
    // Connect to the data source
    const connection = await createDataSourceConnection(dataSource);
    
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
        const [columns] = await connection.query<ColumnInfo[]>(`
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
          // Get accurate row count directly from table
          const [rowCountResult] = await connection.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS rowCount FROM \`${dataSource.database_name}\`.\`${table.name}\``
          );
          
          return {
            ...table,
            rowCount: (rowCountResult[0] as any)?.rowCount || 0,
            columns: columns.map(col => ({
              name: col.name,
              dataType: col.dataType,
              friendlyType: mapDataTypeToFriendlyType(col.dataType),
              nullable: col.nullable === 'YES',
              isPrimaryKey: col.key === 'PRI'
            }))
          };
        } catch (error) {
          console.warn(`Error getting row count for table ${table.name}:`, error);
          // Fallback to the original approach if the COUNT(*) fails
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
              friendlyType: mapDataTypeToFriendlyType(col.dataType),
              nullable: col.nullable === 'YES',
              isPrimaryKey: col.key === 'PRI'
            }))
          };
        }
      })
    );
    
    await connection.end();
    
    res.json(tablesWithColumns);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: `Failed to fetch tables: ${(error as Error).message}` });
  }
});

// Helper function to map SQL data types to friendly types
function mapDataTypeToFriendlyType(dataType: string): string {
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
  
  // Look for matching data type
  for (const key in typeMap) {
    if (dataType.includes(key)) {
      return typeMap[key];
    }
  }
  
  return 'Text'; // Default to Text
}

export default router; 