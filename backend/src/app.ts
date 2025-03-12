import express from 'express';
import cors from 'cors';
import dataSourcesRouter from './routes/dataSources';
import tablesRouter from './routes/tables';
import queryRouter from './routes/query';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/datasources', dataSourcesRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/query', queryRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default app; 