import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Database, 
  Table as TableIcon, 
  Key, 
  Calendar, 
  Hash, 
  DollarSign, 
  Type, 
  Check, 
  AlertCircle,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTablesForDataSource, Table as TableType } from '@/services/tableService';
import { DataSource, TableColumn } from '@/types/dataSource';
import { Input } from './ui/input';

interface TableExplorerProps {
  selectedDataSource: DataSource | null;
  selectedTable: string | null;
  selectedColumns: TableColumn[];
  onSelectColumns: (tableName: string, columns: TableColumn[]) => void;
}

export const TableExplorer: React.FC<TableExplorerProps> = ({ 
  selectedDataSource,
  selectedTable,
  selectedColumns,
  onSelectColumns
}) => {
  const [tables, setTables] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
  const [tableSearch, setTableSearch] = useState('');

  // Load expanded tables from localStorage when component mounts
  useEffect(() => {
    const savedExpandedTables = localStorage.getItem('expandedTables');
    if (savedExpandedTables) {
      try {
        setExpandedTables(JSON.parse(savedExpandedTables));
      } catch (error) {
        console.error('Error parsing saved expanded tables:', error);
      }
    }
    
    // Also load expanded columns
    const savedExpandedColumns = localStorage.getItem('expandedColumns');
    if (savedExpandedColumns) {
      try {
        setExpandedColumns(JSON.parse(savedExpandedColumns));
      } catch (error) {
        console.error('Error parsing saved expanded columns:', error);
      }
    }
  }, []);
  
  // Save expanded tables to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('expandedTables', JSON.stringify(expandedTables));
  }, [expandedTables]);
  
  // Save expanded columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expandedColumns', JSON.stringify(expandedColumns));
  }, [expandedColumns]);

  useEffect(() => {
    if (selectedDataSource) {
      setLoading(true);
      getTablesForDataSource(Number(selectedDataSource.id))
        .then((data: TableType[]) => {
          setTables(data);
          // Initialize expandedTables state
          const expanded: Record<string, boolean> = {};
          data.forEach((table) => {
            expanded[table.name] = false;
          });
          setExpandedTables(expanded);
        })
        .catch((error: Error) => {
          console.error('Failed to fetch tables:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedDataSource]);

  // When selecting a table, expand it and its columns
  useEffect(() => {
    if (selectedTable) {
      setExpandedTables(prev => ({
        ...prev,
        [selectedTable]: true
      }));
      
      // Also expand the columns for the selected table
      if (selectedColumns.length > 0) {
        const columnsToExpand: Record<string, boolean> = {};
        selectedColumns.forEach(column => {
          columnsToExpand[`${selectedTable}-${column.name}`] = true;
        });
        
        setExpandedColumns(prev => ({
          ...prev,
          ...columnsToExpand
        }));
      }
    }
  }, [selectedTable, selectedColumns]);

  // Add a new effect to clear expanded column state when changing tables
  useEffect(() => {
    if (selectedTable) {
      // First, create a filtered copy of expandedColumns that only includes
      // columns from the currently selected table
      const updatedExpandedColumns: Record<string, boolean> = {};
      
      Object.keys(expandedColumns).forEach(key => {
        // Only keep keys that start with the current table name
        if (key.startsWith(`${selectedTable}-`)) {
          updatedExpandedColumns[key] = expandedColumns[key];
        }
      });
      
      // Update the expanded columns state
      setExpandedColumns(updatedExpandedColumns);
    }
  }, [selectedTable]);

  const toggleTableExpanded = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };
  
  // Update the toggleColumnSelection function to handle table switching
  const toggleColumnSelection = (tableName: string, column: any) => {
    let newSelectedColumns: TableColumn[];
    
    // If selecting from a different table than what's currently selected,
    // clear all previous selections and select only this column
    if (selectedTable !== tableName) {
      newSelectedColumns = [column];
      
      // Also expand the new table
      setExpandedTables(prev => {
        const updated = { ...prev };
        // Collapse all tables
        Object.keys(updated).forEach(key => {
          updated[key] = false;
        });
        // Expand only the new table
        updated[tableName] = true;
        return updated;
      });
      
      // Clear expanded columns from previous tables
      const updatedExpandedColumns: Record<string, boolean> = {};
      const columnKey = `${tableName}-${column.name}`;
      updatedExpandedColumns[columnKey] = true;
      setExpandedColumns(updatedExpandedColumns);
    } else {
      // Same table - toggle selection state
      const isColumnSelected = selectedColumns.some(col => 
        col.name === column.name && selectedTable === tableName
      );
      
      if (isColumnSelected) {
        // If column is already selected, remove it
        newSelectedColumns = selectedColumns.filter(col => col.name !== column.name);
        
        // Also update expanded column state
        const columnKey = `${tableName}-${column.name}`;
        setExpandedColumns(prev => {
          const updated = { ...prev };
          delete updated[columnKey];
          return updated;
        });
      } else {
        // Add column to selections
        newSelectedColumns = [...selectedColumns, column];
        
        // Update expanded column state
        const columnKey = `${tableName}-${column.name}`;
        setExpandedColumns(prev => ({
          ...prev,
          [columnKey]: true
        }));
      }
    }
    
    // Update parent component state
    onSelectColumns(tableName, newSelectedColumns);
  };

  // Helper to get the appropriate icon for a column's data type
  const getColumnTypeIcon = (friendlyType: string) => {
    switch (friendlyType) {
      case 'Number':
        return <Hash className="h-3.5 w-3.5" />;
      case 'Currency':
        return <DollarSign className="h-3.5 w-3.5" />;
      case 'Date & Time':
        return <Calendar className="h-3.5 w-3.5" />;
      case 'Text':
      case 'Long Text':
      case 'Email':
        return <Type className="h-3.5 w-3.5" />;
      case 'Yes/No':
        return <Check className="h-3.5 w-3.5" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  // Filter tables based on search text
  const filteredTables = tables.filter(table => 
    tableSearch === '' || 
    table.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // Clear search
  const handleClearSearch = () => {
    setTableSearch('');
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="mt-2 text-sm text-muted-foreground">Loading tables...</span>
      </div>
    );
  }

  if (!selectedDataSource) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <Database className="h-8 w-8 opacity-30" />
        <p className="mt-2">Please select a data source</p>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <TableIcon className="h-8 w-8 opacity-30" />
        <p className="mt-2">No tables found in this database</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-1 flex flex-col">
      <div className="mb-2 flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
        <Database className="mr-1 h-4 w-4" />
        {selectedDataSource?.name}
      </div>
      
      {/* Search input for tables */}
      <div className="px-2 pb-2 mb-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
          {tableSearch && (
            <button 
              className="absolute right-2 top-2.5"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-1 overflow-y-auto flex-1">
        {filteredTables.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            No tables match your search
          </div>
        ) : (
          filteredTables.map((table: TableType) => (
            <div key={table.name} className="rounded-md">
              <button
                onClick={() => toggleTableExpanded(table.name)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent",
                  (expandedTables[table.name] || selectedTable === table.name) ? "bg-accent" : "bg-transparent"
                )}
              >
                <div className="flex items-center">
                  <span className="mr-1">
                    {expandedTables[table.name] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <TableIcon className="mr-2 h-4 w-4 text-primary" />
                  <span>{table.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{table.rowCount} rows</span>
              </button>
              
              {expandedTables[table.name] && (
                <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                  {table.columns.map((column: any) => {
                    // Generate a unique key for this column
                    const columnKey = `${table.name}-${column.name}`;
                    const isSelected = selectedTable === table.name && 
                      selectedColumns.some(col => col.name === column.name);
                    
                    return (
                      <button
                        key={columnKey}
                        className={cn(
                          "flex w-full items-center rounded-md px-2 py-1 text-sm text-left hover:bg-accent",
                          isSelected && "bg-primary/10",
                          // Only show expanded highlight if the column is expanded AND not selected
                          expandedColumns[columnKey] && !isSelected ? "bg-accent/50" : ""
                        )}
                        onClick={() => {
                          toggleColumnSelection(table.name, column);
                          
                          // Toggle expanded state for this column
                          setExpandedColumns(prev => ({
                            ...prev,
                            [columnKey]: !prev[columnKey]
                          }));
                        }}
                      >
                        <div className="mr-2 flex h-4 w-4 items-center justify-center text-muted-foreground">
                          {column.isPrimaryKey ? (
                            <Key className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            getColumnTypeIcon(column.friendlyType)
                          )}
                        </div>
                        <span className={cn(
                          column.isPrimaryKey && "font-medium",
                          isSelected && "text-primary font-medium"
                        )}>
                          {column.name}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {column.friendlyType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 