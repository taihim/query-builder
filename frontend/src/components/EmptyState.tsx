import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  onAddDataSource: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddDataSource }) => {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">No data sources found</h2>
        <p className="mb-6 mt-2 text-center text-muted-foreground">
          Get started by adding your first database connection
        </p>
        <Button onClick={onAddDataSource} className="animate-bounce">
          <Plus className="mr-2 h-4 w-4" />
          Add new data source
        </Button>
      </div>
    </div>
  );
}; 