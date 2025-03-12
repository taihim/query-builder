import express from 'express';
import { TableController } from '../controllers/tableController';

const router = express.Router();

// Get tables for a data source
router.get('/:dataSourceId', TableController.getTablesForDataSource);

export default router; 