import express from 'express';
import { QueryController } from '../controllers/queryController';

const router = express.Router();

// POST endpoint for queries
router.post('/', QueryController.executePostQuery);

// GET endpoint for queries
router.get('/', QueryController.executeGetQuery);

export default router; 