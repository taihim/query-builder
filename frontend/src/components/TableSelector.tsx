import React, { useState, useEffect } from 'react';
import { getTablesForDataSource } from '../services/tableService';

interface TableSelectorProps {
  dataSourceId: number;
  onTableSelect: (tableName: string | null) => void;
}

interface Table {
  name: string;
  schema: string;
  rowCount: number;
  columns: any[];
}

const TableSelector: React.FC<TableSelectorProps> = ({ dataSourceId, onTableSelect }) => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Table[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        setError(null);
        const tablesData = await getTablesForDataSource(dataSourceId);
        setTables(tablesData);
      } catch (err) {
        console.error('Error fetching tables:', err);
        setError('Failed to fetch tables');
      } finally {
        setLoading(false);
      }
    };

    if (dataSourceId) {
      fetchTables();
    }
  }, [dataSourceId]);

  if (loading) {
    return <div className="my-4">Loading tables...</div>;
  }

  if (error) {
    return <div className="text-red-500 my-4">{error}</div>;
  }

  if (tables.length === 0) {
    return <div className="my-4">No tables found in this data source.</div>;
  }

  return (
    <div className="my-4">
      <h3 className="text-lg font-medium mb-2">Select a Table</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.name}
            onClick={() => onTableSelect(table.name)}
            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">{table.name}</div>
            <div className="text-sm text-gray-500">{table.rowCount.toLocaleString()} rows</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSelector; 