import React, { useState, useEffect } from 'react';
import { Column } from '../services/queryService';
import { getTablesForDataSource } from '../services/tableService';

interface ColumnSelectorProps {
  dataSourceId: number;
  tableName: string;
  onColumnsSelect: (columns: Column[]) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ 
  dataSourceId, 
  tableName, 
  onColumnsSelect 
}) => {
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Column[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        setLoading(true);
        setError(null);
        const tables = await getTablesForDataSource(dataSourceId);
        const table = tables.find(t => t.name === tableName);
        
        if (table) {
          setColumns(table.columns);
          // Initially select all columns
          setSelectedColumns(table.columns);
          onColumnsSelect(table.columns);
        } else {
          throw new Error(`Table ${tableName} not found`);
        }
      } catch (err) {
        console.error('Error fetching columns:', err);
        setError('Failed to fetch columns');
      } finally {
        setLoading(false);
      }
    };

    if (dataSourceId && tableName) {
      fetchColumns();
    }
  }, [dataSourceId, tableName, onColumnsSelect]);

  const toggleColumn = (column: Column) => {
    if (selectedColumns.some(col => col.name === column.name)) {
      const newSelection = selectedColumns.filter(col => col.name !== column.name);
      setSelectedColumns(newSelection);
      onColumnsSelect(newSelection);
    } else {
      const newSelection = [...selectedColumns, column];
      setSelectedColumns(newSelection);
      onColumnsSelect(newSelection);
    }
  };

  const toggleAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
      onColumnsSelect([]);
    } else {
      setSelectedColumns([...columns]);
      onColumnsSelect([...columns]);
    }
  };

  if (loading) {
    return <div className="my-4">Loading columns...</div>;
  }

  if (error) {
    return <div className="text-red-500 my-4">{error}</div>;
  }

  return (
    <div className="my-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Select Columns</h3>
        <button 
          onClick={toggleAll}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {selectedColumns.length === columns.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {columns.map((column) => (
          <div 
            key={column.name}
            className="flex items-center"
          >
            <input
              type="checkbox"
              id={`column-${column.name}`}
              checked={selectedColumns.some(col => col.name === column.name)}
              onChange={() => toggleColumn(column)}
              className="mr-2"
            />
            <label 
              htmlFor={`column-${column.name}`}
              className="cursor-pointer text-sm"
            >
              {column.name}
              <span className="text-xs text-gray-500 ml-1">({column.friendlyType})</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnSelector; 