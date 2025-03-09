import express, { Request, Response } from 'express';
import { appPool, createDataSourceConnection } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all data sources (sanitized, without passwords)
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await appPool.query<RowDataPacket[]>(
      'SELECT id, name, type, host, port, database_name, username, created_at FROM data_sources'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
});

// Add a new endpoint to test connections
router.post('/test-connection', async (req: Request, res: Response) => {
  console.log('Test connection request received:', req.body);
  
  const { type, host, port, username, password, database_name } = req.body;
  
  if (!type || !host || !port || !username || !password || !database_name) {
    console.log('Invalid request parameters:', { type, host, port, username, password: '***', database_name });
    return res.status(400).json({ success: false, message: 'Missing required connection parameters' });
  }
  
  try {
    const connection = await createDataSourceConnection({
      host, port, username, password, database_name
    });
    
    await connection.ping();
    
    await connection.end();
    
    res.json({ success: true, message: 'Connection successful!' });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(400).json({ 
      success: false, 
      message: `Connection failed: ${(error as Error).message}` 
    });
  }
}); 


// Add a new data source
router.post('/', async (req: Request, res: Response) => {
  const { name, type, host, port, database_name, username, password } = req.body;
  
  // Validation
  if (!name || !type || !host || !port || !database_name || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Test connection before saving
  try {
    const connection = await createDataSourceConnection({
      host, port, username, password, database_name
    });
    await connection.end(); // Close the test connection
    
    // Save the data source
    const [result] = await appPool.query<ResultSetHeader>(
      'INSERT INTO data_sources (name, type, host, port, database_name, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, host, port, database_name, username, password]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      type,
      host,
      port,
      database_name,
      username,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error adding data source:', error);
    res.status(500).json({ error: `Failed to add data source: ${(error as Error).message}` });
  }
});

// Delete a data source
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await appPool.query('DELETE FROM data_sources WHERE id = ?', [id]);
    res.status(200).json({ message: 'Data source deleted successfully' });
  } catch (error) {
    console.error('Error deleting data source:', error);
    res.status(500).json({ error: 'Failed to delete data source' });
  }
});

// Update an existing data source or create it if it doesn't exist
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type, host, port, database_name, username, password } = req.body;
  
  // Validation
  if (!name || !type || !host || !port || !database_name || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    // Check if data source exists
    const [existingSource] = await appPool.query<RowDataPacket[]>(
      'SELECT id FROM data_sources WHERE id = ?',
      [id]
    );
    
    let sourceId = id;
    let isNewSource = false;
    
    if ((existingSource as any).length === 0) {
      // Data source doesn't exist, create a new one
      const [result] = await appPool.query<ResultSetHeader>(
        'INSERT INTO data_sources (name, type, host, port, database_name, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, type, host, port, database_name, username, password]
      );
      
      sourceId = result.insertId.toString();
      isNewSource = true;
    } else {
      // Data source exists, update it
      await appPool.query(
        'UPDATE data_sources SET name = ?, type = ?, host = ?, port = ?, database_name = ?, username = ?, password = ? WHERE id = ?',
        [name, type, host, port, database_name, username, password, id]
      );
    }
    
    // Fetch the updated or created data source
    const [updatedSource] = await appPool.query<RowDataPacket[]>(
      'SELECT id, name, type, host, port, database_name, username, created_at FROM data_sources WHERE id = ?',
      [sourceId]
    );
    
    res.status(isNewSource ? 201 : 200).json(updatedSource[0]);
  } catch (error) {
    console.error('Error updating data source:', error);
    res.status(500).json({ error: `Failed to update data source: ${(error as Error).message}` });
  }
});

export default router; 