import { useState, useEffect } from 'react';
import { DataSource, TableColumn } from '../types/dataSource';

export const useQueryState = (selectedDataSource: DataSource | null) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<TableColumn[]>([]);

  useEffect(() => {
    if (selectedDataSource) {
      const savedTableName = localStorage.getItem('selectedTable');
      const savedColumnsString = localStorage.getItem('selectedColumns');
      
      if (savedTableName) {
        setSelectedTable(savedTableName);
        
        if (savedColumnsString) {
          try {
            const savedColumns = JSON.parse(savedColumnsString);
            setSelectedColumns(savedColumns);
          } catch (e) {
            console.error('Error parsing saved columns:', e);
            setSelectedColumns([]);
          }
        }
      }
    } else {
      setSelectedTable(null);
      setSelectedColumns([]);
    }
  }, [selectedDataSource]);

  const handleSelectColumns = (tableName: string, columns: TableColumn[]) => {
    setSelectedTable(tableName);
    setSelectedColumns(columns);
    localStorage.setItem('selectedTable', tableName);
    localStorage.setItem('selectedColumns', JSON.stringify(columns));
  };

  return {
    selectedTable,
    selectedColumns,
    handleSelectColumns
  };
}; 