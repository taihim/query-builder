import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, LayoutGrid, X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TableColumn } from '@/types/dataSource';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { cn } from '@/lib/utils';

export type FilterOperator = 'equals' | 'contains' | 'greater' | 'less' | 'empty' | 'not-empty';
export type SortDirection = 'asc' | 'desc';

export interface TableFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface TableSort {
  column: string;
  direction: SortDirection;
}

interface TableOperationsProps {
  columns: TableColumn[];
  onSearch: (query: string) => void;
  onFilter: (filters: TableFilter[]) => void;
  onSort: (sort: TableSort | null) => void;
  onGroupBy: (column: string | null) => void;
}

export const TableOperations: React.FC<TableOperationsProps> = ({
  columns,
  onSearch,
  onFilter,
  onSort,
  onGroupBy
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSorting, setShowSorting] = useState(false);
  const [showGrouping, setShowGrouping] = useState(false);
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [activeSort, setActiveSort] = useState<TableSort | null>(null);
  const [groupByColumn, setGroupByColumn] = useState<string | null>(null);

  // Reset state when columns change to avoid stale references
  useEffect(() => {
    // If columns change and we have filters/sorts referencing old columns, reset them
    if (columns.length === 0) {
      if (filters.length > 0) {
        setFilters([]);
        onFilter([]);
      }
      if (activeSort) {
        setActiveSort(null);
        onSort(null);
      }
      if (groupByColumn) {
        setGroupByColumn(null);
        onGroupBy(null);
      }
    } else if (filters.length > 0) {
      // Check if any filter references a column that no longer exists
      const validColumns = new Set(columns.map(c => c.name));
      const updatedFilters = filters.filter(f => validColumns.has(f.column));
      
      if (updatedFilters.length !== filters.length) {
        setFilters(updatedFilters);
        onFilter(updatedFilters);
      }
    }
  }, [columns]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value;
      setSearchQuery(value);
      onSearch(value);
    } catch (error) {
      console.error("Error in search handler:", error);
    }
  };

  const addFilter = () => {
    try {
      if (columns.length === 0) return;
      
      const newFilter: TableFilter = {
        id: Math.random().toString(36).substring(2, 9),
        column: columns[0].name,
        operator: 'equals',
        value: ''
      };
      
      const updatedFilters = [...filters, newFilter];
      setFilters(updatedFilters);
      onFilter(updatedFilters);
    } catch (error) {
      console.error("Error adding filter:", error);
    }
  };

  const updateFilter = (id: string, field: keyof TableFilter, value: string) => {
    try {
      const updatedFilters = filters.map(filter => {
        if (filter.id === id) {
          return { ...filter, [field]: value };
        }
        return filter;
      });
      
      setFilters(updatedFilters);
      onFilter(updatedFilters);
    } catch (error) {
      console.error("Error updating filter:", error);
    }
  };

  const removeFilter = (id: string) => {
    try {
      const updatedFilters = filters.filter(filter => filter.id !== id);
      setFilters(updatedFilters);
      onFilter(updatedFilters);
    } catch (error) {
      console.error("Error removing filter:", error);
    }
  };

  const handleSort = (column: string, direction: SortDirection) => {
    try {
      const sort = { column, direction };
      setActiveSort(sort);
      onSort(sort);
    } catch (error) {
      console.error("Error setting sort:", error);
    }
  };

  const clearSort = () => {
    try {
      setActiveSort(null);
      onSort(null);
    } catch (error) {
      console.error("Error clearing sort:", error);
    }
  };

  const handleGroupBy = (column: string | null) => {
    try {
      setGroupByColumn(column);
      onGroupBy(column);
    } catch (error) {
      console.error("Error setting group by:", error);
    }
  };

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater', label: 'Greater than' },
    { value: 'less', label: 'Less than' },
    { value: 'empty', label: 'Is empty' },
    { value: 'not-empty', label: 'Is not empty' }
  ];

  // Safety check - don't render if columns array is not valid
  if (!Array.isArray(columns)) {
    console.error("Columns prop is not an array:", columns);
    return null;
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex flex-wrap gap-2", filters.length > 0 && "mb-2")}>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search results..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1"
          disabled={columns.length === 0}
        >
          <Filter className="h-4 w-4" />
          {filters.length > 0 ? `Filters (${filters.length})` : "Filters"}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSorting(!showSorting)}
          className="gap-1"
          disabled={columns.length === 0}
        >
          <ArrowUpDown className="h-4 w-4" />
          {activeSort ? `Sorted by ${activeSort.column}` : "Sort"}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrouping(!showGrouping)}
          className="gap-1"
          disabled={columns.length === 0}
        >
          <LayoutGrid className="h-4 w-4" />
          {groupByColumn ? `Grouped by ${groupByColumn}` : "Group By"}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && columns.length > 0 && (
        <div className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">Filters</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addFilter}
              disabled={columns.length === 0}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Filter
            </Button>
          </div>
          
          {filters.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No filters applied. Click "Add Filter" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {filters.map(filter => (
                <div key={filter.id} className="flex items-center gap-2">
                  <Select
                    value={filter.column}
                    onValueChange={(value) => updateFilter(filter.id, 'column', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(column => (
                        <SelectItem key={column.name} value={column.name}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {!['empty', 'not-empty'].includes(filter.operator) && (
                    <Input
                      placeholder="Value"
                      className="h-8"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                    />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sorting Panel */}
      {showSorting && columns.length > 0 && (
        <div className="rounded-md border p-3">
          <h3 className="mb-2 text-sm font-medium">Sort Results</h3>
          
          <div className="flex items-center gap-2">
            <Select
              value={activeSort?.column || 'none'}
              onValueChange={(column) => column !== 'none' ? handleSort(column, 'asc') : clearSort()}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select column to sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  -- None --
                </SelectItem>
                {columns.map(column => (
                  <SelectItem key={column.name} value={column.name}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {activeSort && (
              <div className="flex gap-2">
                <Button
                  variant={activeSort.direction === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort(activeSort.column, 'asc')}
                  className="h-8"
                >
                  Ascending
                </Button>
                <Button
                  variant={activeSort.direction === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort(activeSort.column, 'desc')}
                  className="h-8"
                >
                  Descending
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group By Panel */}
      {showGrouping && columns.length > 0 && (
        <div className="rounded-md border p-3">
          <h3 className="mb-2 text-sm font-medium">Group Results By</h3>
          
          <Select
            value={groupByColumn || 'none'}
            onValueChange={(column) => handleGroupBy(column === 'none' ? null : column)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select a column to group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                -- None --
              </SelectItem>
              {columns.map(column => (
                <SelectItem key={column.name} value={column.name}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}; 