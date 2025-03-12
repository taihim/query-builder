import express from 'express';
import { DataSourceController } from '../controllers/dataSourceController';

const router = express.Router();

// Get all data sources
router.get('/', DataSourceController.getAllDataSources);

// Test connection
router.post('/test-connection', DataSourceController.testConnection);

// Add a new data source
router.post('/', DataSourceController.createDataSource);

// Delete a data source
router.delete('/:id', DataSourceController.deleteDataSource);

// Update an existing data source
router.put('/:id', DataSourceController.updateDataSource);

export default router; 