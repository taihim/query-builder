import React from 'react';
import { DataSource, TableColumn } from '@/types/dataSource';
import { motion } from 'framer-motion';
import { Layout } from './Layout';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import QueryResults from './QueryResults';

interface MainContentProps {
  loading: boolean;
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  selectedTable: string | null;
  selectedColumns: TableColumn[];
  deletingId: string | null;
  onAddClick: () => void;
  onSelectColumns: (tableName: string, columns: TableColumn[]) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  loading,
  dataSources,
  selectedDataSource,
  selectedTable,
  selectedColumns,
  deletingId,
  onAddClick,
  onSelectColumns,
}) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (dataSources.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={deletingId === selectedDataSource?.id ? "animate-shake" : ""}
    >
      <Layout
        selectedDataSource={selectedDataSource}
        selectedTable={selectedTable}
        selectedColumns={selectedColumns}
        onSelectColumns={onSelectColumns}
      >
        <div className="container p-8">
          <h2 className="text-2xl font-bold text-foreground">
            {selectedTable
              ? `Table: ${selectedTable}`
              : selectedDataSource
                ? `${selectedDataSource.name} Dashboard`
                : 'Select a Data Source'
            }
          </h2>
          <p className="mb-6 text-muted-foreground">
            {selectedTable
              ? `Use the sidebar to select columns for your query`
              : selectedDataSource
                ? 'Click on a table in the sidebar to explore its columns'
                : 'Choose a data source from the dropdown to start working'
            }
          </p>

          {selectedTable && selectedColumns.length > 0 && selectedDataSource && (
            <QueryResults
              dataSourceId={Number(selectedDataSource.id)}
              tableName={selectedTable}
              columns={selectedColumns}
            />
          )}
        </div>
      </Layout>
    </motion.div>
  );
}; 