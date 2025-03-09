import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dataSourceRoutes from './routes/dataSources';
import tableRoutes from './routes/tables';
import queryRoutes from './routes/query';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/datasources', dataSourceRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/query', queryRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'An unexpected error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 