import React, { useState } from 'react';
import { Column } from '../services/queryService';
import TableSelector from './TableSelector';
import ColumnSelector from './ColumnSelector';
import QueryResults from './QueryResults';

interface QueryBuilderProps {
  dataSourceId: number;
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({ dataSourceId }) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Column[]>([]);

  // Handler for selecting a table
  const handleTableSelect = (tableName: string | null) => {
    setSelectedTable(tableName);
    setSelectedColumns([]);
  };

  // Handler for selecting columns
  const handleColumnsSelect = (columns: Column[]) => {
    setSelectedColumns(columns);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Query Builder</h2>
      
      <TableSelector 
        dataSourceId={dataSourceId} 
        onTableSelect={handleTableSelect} 
      />
      
      {selectedTable && (
        <ColumnSelector
          dataSourceId={dataSourceId}
          tableName={selectedTable}
          onColumnsSelect={handleColumnsSelect}
        />
      )}
      
      {selectedTable && selectedColumns.length > 0 && (
        <QueryResults 
          dataSourceId={dataSourceId}
          tableName={selectedTable}
          columns={selectedColumns}
        />
      )}
    </div>
  );
};

export default QueryBuilder; 