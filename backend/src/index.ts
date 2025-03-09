import express, { Request, Response } from 'express';
import dataSourcesRouter from './routes/dataSources';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/data-sources', dataSourcesRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 