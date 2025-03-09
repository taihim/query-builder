import express, { Request, Response } from 'express';
import { appPool, createDataSourceConnection } from '../db';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

interface Column {
  name: string;
  dataType: string;
  friendlyType: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

router.post('/', async (req: Request, res: Response) => {
  const { dataSourceId, tableName, columns, page = 1, pageSize = 100 } = req.body;
  
  if (!dataSourceId || !tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }
  
  try {
    const [dataSources] = await appPool.query<RowDataPacket[]>(
      'SELECT * FROM data_sources WHERE id = ?', 
      [dataSourceId]
    );

    if (dataSources.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const dataSource = dataSources[0];
    
    const dataSourceConfig = {
      host: dataSource.host,
      port: dataSource.port,
      username: dataSource.username,
      password: dataSource.password,
      database_name: dataSource.database_name
    };
    
    const connection = await createDataSourceConnection(dataSourceConfig);
    
    const offset = (page - 1) * pageSize;
    
    const columnNames = columns.map((col: Column) => col.name).join(', ');
    
    const [countResult] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM ${tableName}`
    );
    const totalRows = (countResult[0] as any).total;
    const totalPages = Math.ceil(totalRows / pageSize);
    
    const query = `SELECT ${columnNames} FROM ${tableName} LIMIT ? OFFSET ?`;
    const [rows] = await connection.query<RowDataPacket[]>(query, [pageSize, offset]);
    
    await connection.end();
    
    res.json({
      columns: columns,
      rows: rows,
      pagination: {
        page,
        pageSize,
        totalRows,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: `Query execution failed: ${(error as Error).message}` });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const dataSourceId = Number(req.query.dataSourceId);
    const tableName = req.query.tableName as string;
    const noLimit = req.query.noLimit as string;
    const columns = Array.isArray(req.query.columns) 
      ? req.query.columns as string[] 
      : [req.query.columns as string];
    


    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '10', 10);
    
    const sortColumn = req.query.sortColumn as string;
    const sortDirection = req.query.sortDirection as string;
    
    console.log("Query params:", req.query);
    console.log("Nolimit:", noLimit);
    console.log("Nolimit == true:", noLimit === 'true');

    
    const filters: Record<string, Record<string, unknown>> = {};
    
    Object.keys(req.query).forEach(key => {
      const filterMatch = key.match(/^filter/);
      if (filterMatch) {
        Object.keys(req.query[key] as Object).forEach(columnName => {
          console.log("key in filter for each", columnName);
          
          if (!filters[columnName]) {
            filters[columnName] = {};
          }
          // @ts-expect-error
          filters[columnName].value = req.query[key][columnName]["value"] as string;
          // @ts-expect-error
          filters[columnName].operator = req.query[key][columnName]["operator"] as string;
        });
      }
    });
    
    const [dataSources] = await appPool.query<RowDataPacket[]>(
      'SELECT * FROM data_sources WHERE id = ?', 
      [dataSourceId]
    );

    if (dataSources.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const dataSource = dataSources[0];
    
    const dataSourceConfig = {
      host: dataSource.host,
      port: dataSource.port,
      username: dataSource.username,
      password: dataSource.password,
      database_name: dataSource.database_name
    };
    
    const connection = await createDataSourceConnection(dataSourceConfig);
    
    let query = `SELECT ${columns.join(', ')} FROM ${tableName}`;
    const queryParams: any[] = [];
    
    const filterClauses: string[] = [];
    console.log("filters", filters);
    Object.entries(filters).forEach(([columnName, filter]) => {
      console.log("columnName", columnName);
      console.log("filter", filter);
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
    
    if (sortColumn && (sortDirection === 'asc' || sortDirection === 'desc')) {
      query += ` ORDER BY ${sortColumn} ${sortDirection.toUpperCase()}`;
    }
    
    const countQuery = `SELECT COUNT(*) AS total FROM ${tableName}${
      query.includes('WHERE') ? ` WHERE ${query.split('WHERE')[1].split('ORDER BY')[0]}` : ''
    }`;

    const [countResult] = await connection.query<RowDataPacket[]>(countQuery, queryParams);
    const totalRows = (countResult[0] as RowDataPacket).total;
    
    if (noLimit === 'false') {
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(pageSize, (page - 1) * pageSize);
    }
    const [rows] = await connection.query<RowDataPacket[]>(query, queryParams);
    res.json({
      rows,
      totalRows,
      page,
      pageSize,
      totalPages: Math.ceil(totalRows / pageSize)
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: `Failed to execute query: ${(error as Error).message}` });
  }
});

export default router; 