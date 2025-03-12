import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Column, executeQueryWithPagination, executeQueryForVisualization } from '@/services/queryService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Filter, X, Check, RefreshCw, FilterX, Calendar as CalendarIcon, BarChart4, Table as TableIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface QueryResultsProps {
  dataSourceId: number;
  tableName: string;
  columns: Column[];
}

interface FilterState {
  filters: Record<string, {
    value: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  }>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  page: number;
  pageSize: number;
}

const QueryResults: React.FC<QueryResultsProps> = ({ dataSourceId, tableName, columns }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, { value: string; operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' }>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [pendingFilters, setPendingFilters] = useState<Record<string, { value: string; operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' }>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("data");
  const [fullDataset, setFullDataset] = useState<Record<string, any>[]>([]);
  const [fullDataLoading, setFullDataLoading] = useState(false);
  const [selectedChartTypes, setSelectedChartTypes] = useState<Record<string, string>>({});
  const [chartOptionsExpanded, setChartOptionsExpanded] = useState(true);

  // Generate a unique key for this query's filter state in localStorage
  const storageKey = useMemo(() => 
    `queryFilters-${dataSourceId}-${tableName}`, 
    [dataSourceId, tableName]
  );
  
  // Step 1: Load filters FIRST, before any data fetching happens
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(storageKey);
      
      if (savedState) {
        const parsedState: FilterState = JSON.parse(savedState);
        
        // Set filters
        const loadedFilters = parsedState.filters || {};
        setFilters(loadedFilters);
        
        // Update active filters based on which filters have values
        const newActiveFilters = Object.entries(loadedFilters)
          .filter(([_, filter]) => filter.value !== '')
          .map(([column]) => column);
        setActiveFilters(newActiveFilters);
        
        // Set sort config
        if (parsedState.sortColumn) {
          setSortConfig({
            column: parsedState.sortColumn,
            direction: parsedState.sortDirection as 'asc' | 'desc'
          });
        } else {
          setSortConfig(null);
        }
        
        // Set pagination
        setPage(parsedState.page || 1);
        setPageSize(parsedState.pageSize || 10);
        
        console.log('Filter state loaded successfully');
      }
    } catch (error) {
      console.error('Error loading saved filter state:', error);
    } finally {
      // Mark filters as loaded regardless of success/failure
      setFiltersLoaded(true);
    }
  }, [storageKey]); // Only run once when component mounts or storageKey changes
  
  // Save filter state synchronously whenever it changes
  const saveFilterState = useCallback(() => {
    try {
      const filterState: FilterState = {
        filters,
        sortColumn: sortConfig?.column || null,
        sortDirection: sortConfig?.direction || null,
        page,
        pageSize
      };
      
      console.log('Saving filter state:', filterState);
      localStorage.setItem(storageKey, JSON.stringify(filterState));
    } catch (error) {
      console.error('Error saving filter state:', error);
    }
  }, [filters, sortConfig, page, pageSize, storageKey]);
  
  // Save whenever any part of the filter state changes
  useEffect(() => {
    saveFilterState();
  }, [saveFilterState]);
  
  // Reset pagination when table or columns change
  useEffect(() => {
    // Don't reset filters on initial load
    if (loading) return;
    
    setPage(1);
    setFilters({});
    setActiveFilters([]);
    setSortConfig(null);
    setSearchText('');
    
    // Clear localStorage for this table's filters
    localStorage.removeItem(storageKey);
  }, [tableName, columns]);

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const result = await executeQueryWithPagination(
        dataSourceId,
        tableName,
        columns,
        page,
        pageSize,
        sortConfig,
        filters
      );

      setRows(result.rows);
      setTotalRows(result.totalRows);
      
      // Check if the fetched data is empty
      if (result.rows.length === 0) {
        console.warn('No data returned for charts');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Step 2: Only fetch data AFTER filters are loaded
  useEffect(() => {
    // Skip fetch until filters are loaded
    if (!filtersLoaded) {
      return;
    }
    
    fetchData();
    
  }, [dataSourceId, tableName, columns, page, pageSize, sortConfig, filters, filtersLoaded]);

  // Filter data client-side based on search text
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    
    return rows.filter(row => {
      return Object.values(row).some(value => 
        value !== null && 
        value.toString().toLowerCase().includes(searchText.toLowerCase())
      );
    });
  }, [rows, searchText]);

  const totalPages = Math.ceil(totalRows / pageSize);

  const handleSort = (columnName: string) => {
    setSortConfig(current => {
      if (current?.column !== columnName) {
        return { column: columnName, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { column: columnName, direction: 'desc' };
      }
      return null;
    });
  };

  // Initialize pendingFilters when filters change
  useEffect(() => {
    setPendingFilters({...filters});
  }, [filters]);

  // Update handleApplyFilters to actually apply the filters
  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    
    // Update activeFilters based on which filters have values
    const newActiveFilters = Object.entries(pendingFilters)
      .filter(([_, filter]) => filter.value !== '')
      .map(([column]) => column);
    
    setActiveFilters(newActiveFilters);
    setFilterOpen(false); // Close the popover after applying
  };

  const handleUpdatePendingFilter = (
    columnName: string, 
    value: string, 
    operator: Record<string, { value: string; operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' }>[string]['operator'] = 'contains'
  ) => {
    setPendingFilters(prev => ({
      ...prev,
      [columnName]: { value, operator: prev[columnName]?.operator || operator }
    }));
  };

  const handleUpdatePendingOperator = (
    columnName: string, 
    operator: Record<string, { value: string; operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' }>[string]['operator']
  ) => {
    setPendingFilters(prev => ({
      ...prev,
      [columnName]: { value: prev[columnName]?.value || '', operator }
    }));
  };

  const clearPendingFilter = (columnName: string) => {
    setPendingFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnName];
      return newFilters;
    });
  };

  const handleRefreshData = () => {
    fetchData(true);
  };

  const handleClearFilters = () => {
    setFilters({});
    setActiveFilters([]);
    setPendingFilters({});
    
    setPage(1);
    
    setSearchText('');
    
    localStorage.removeItem(storageKey);
  };

  // Helper function to get appropriate operators based on column type
  const getOperatorsForColumnType = (column: Column) => {
    // Default operators for all types
    const defaultOperators = [
      { value: 'equals', label: 'Equals' }
    ];
    
    switch (column.friendlyType) {
      case 'Number':
      case 'Currency':
        return [
          ...defaultOperators,
          { value: 'greaterThan', label: 'Greater than' },
          { value: 'lessThan', label: 'Less than' }
        ];
        
      case 'Date & Time':
      case 'Date':
      case 'Time':
        return [
          ...defaultOperators,
          { value: 'greaterThan', label: 'After' },
          { value: 'lessThan', label: 'Before' }
        ];
        
      case 'Text':
      case 'Long Text':
      case 'Email':
      case 'String':
        return [
          ...defaultOperators,
          { value: 'contains', label: 'Contains' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' }
        ];
        
      case 'Yes/No':
      case 'Boolean':
        return defaultOperators;
        
      default:
        // For unknown types, return all operators
        return [
          ...defaultOperators,
          { value: 'contains', label: 'Contains' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
          { value: 'greaterThan', label: 'Greater than' },
          { value: 'lessThan', label: 'Less than' }
        ];
    }
  };

  // Function to determine if a column is a date type
  const isDateTimeColumn = (column: Column) => {
    return column.friendlyType === 'Date & Time' || 
           column.friendlyType === 'Date' || 
           column.friendlyType === 'Time';
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (columnName: string, date: Date | undefined) => {
    if (!date) return;
    
    // Format the date as ISO string for backend processing
    const formattedDate = date.toISOString();
    
    // Update the pending filter with this date
    setPendingFilters(prev => ({
      ...prev,
      [columnName]: { 
        value: formattedDate, 
        operator: prev[columnName]?.operator || 'equals' 
      }
    }));
  };
  
  // Render filter input based on column type
  const renderFilterInput = (column: Column) => {
    if (isDateTimeColumn(column)) {
      // For date columns, show a date picker
      return (
        <div className="flex flex-row gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 justify-start text-left font-normal w-full"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {pendingFilters[column.name]?.value 
                  ? format(new Date(pendingFilters[column.name].value), 'PPP')
                  : <span className="text-muted-foreground">Pick a date</span>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={pendingFilters[column.name]?.value 
                  ? new Date(pendingFilters[column.name].value) 
                  : undefined
                }
                onSelect={(date) => handleDateSelect(column.name, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {pendingFilters[column.name]?.value && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleUpdatePendingFilter(column.name, '', pendingFilters[column.name]?.operator)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear date</span>
            </Button>
          )}
        </div>
      );
    }
    
    // For non-date columns, show regular input
    return (
      <Input 
        className="h-8"
        placeholder="Value..."
        value={pendingFilters[column.name]?.value || ''}
        onChange={(e) => handleUpdatePendingFilter(
          column.name,
          e.target.value,
          pendingFilters[column.name]?.operator || 'equals'
        )}
      />
    );
  };

  // Function to determine if a column is numeric
  const isNumericColumn = (column: Column) => {
    return column.friendlyType === 'Number' || 
           column.friendlyType === 'Currency';
  };
  
  // Function to determine if a column is categorical (low cardinality)
  const isCategoricalColumn = (column: Column, dataset: Record<string, any>[]) => {
    if (dataset.length === 0) return false;
    
    // Check if this column has a reasonable number of unique values
    const uniqueValues = new Set();
    dataset.forEach(row => uniqueValues.add(row[column.name]));
    
    // If 15 or fewer unique values and not a numeric column, consider it categorical
    return uniqueValues.size <= 15 && !isNumericColumn(column);
  };
  
  // Render the existing table and filter UI
  const renderDataTab = () => {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {columns.map((column) => (
                    <th 
                      key={column.name}
                      className="border-b h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                    >
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort(column.name)}
                        className="h-8 px-2 py-0 font-medium"
                      >
                        {column.name}
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${
                          sortConfig?.column === column.name 
                            ? 'opacity-100' 
                            : 'opacity-40'
                        }`} />
                      </Button>
                      {activeFilters.includes(column.name) && (
                        <span className="ml-1 text-xs text-primary">(filtered)</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="h-32 text-center">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b hover:bg-muted/50">
                      {columns.map((column) => (
                        <td 
                          key={`${rowIndex}-${column.name}`} 
                          className="px-4 py-2"
                        >
                          {row[column.name] !== null ? String(row[column.name]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {rows.length > 0 ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, totalRows)} of {totalRows} rows
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };
  
  // Function to fetch full dataset for charts
  const fetchFullDataForCharts = useCallback(async () => {
    if (!dataSourceId || !tableName || columns.length === 0) return;
    
    try {
      setFullDataLoading(true);
      
      // Call a new API endpoint that fetches data without pagination
      const result = await executeQueryForVisualization(
        dataSourceId,
        tableName,
        columns.map(c => c.name),
        filters,
        sortConfig?.column,
        sortConfig?.direction
      );
      
      setFullDataset(result.rows);
    } catch (error) {
      console.error('Error fetching full dataset:', error);
    } finally {
      setFullDataLoading(false);
    }
  }, [dataSourceId, tableName, columns, filters, sortConfig]);
  
  // Update the useEffect that fetches visualization data
  useEffect(() => {
    if (activeTab === "visualizations") {
      // Fetch full dataset when tab is visualization and:
      // 1. Dataset is empty OR
      // 2. Columns have changed since last fetch
      fetchFullDataForCharts();
    }
  }, [activeTab, columns, fetchFullDataForCharts]); // Add columns to dependencies
  
  // Render chart options based on column types
  const renderChartOptions = () => {
    const numericColumns = columns.filter(isNumericColumn);
    const categoricalColumns = columns.filter(column => 
      isCategoricalColumn(column, fullDataset)
    );
    const dateColumns = columns.filter(column => 
      column.friendlyType === 'Date & Time' || 
      column.friendlyType === 'Date'
    );
    
    return (
      <div className="space-y-6 p-4 bg-white border">        
        {numericColumns.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Numeric Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {numericColumns.map(column => (
                <div key={`numeric-${column.name}`} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{column.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={selectedChartTypes[column.name] === 'bar' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => toggleChartType(column.name, 'bar')}
                      className="flex items-center gap-1"
                    >
                      <BarChartIcon className="h-3.5 w-3.5" />
                      Bar
                    </Button>
                    <Button 
                      variant={selectedChartTypes[column.name] === 'line' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => toggleChartType(column.name, 'line')}
                      className="flex items-center gap-1"
                    >
                      <LineChartIcon className="h-3.5 w-3.5" />
                      Line
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show options for categorical data */}
        {categoricalColumns.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Categorical Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoricalColumns.map(column => (
                <div key={`categorical-${column.name}`} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{column.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={selectedChartTypes[column.name] === 'pie' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => toggleChartType(column.name, 'pie')}
                      className="flex items-center gap-1"
                    >
                      <PieChartIcon className="h-3.5 w-3.5" />
                      Pie
                    </Button>
                    <Button 
                      variant={selectedChartTypes[column.name] === 'bar' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => toggleChartType(column.name, 'bar')}
                      className="flex items-center gap-1"
                    >
                      <BarChartIcon className="h-3.5 w-3.5" />
                      Bar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show options for time series */}
        {dateColumns.length > 0 && numericColumns.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Time Series</h4>
            <div className="grid grid-cols-1 gap-3">
              {dateColumns.map(dateColumn => (
                <div key={`time-${dateColumn.name}`} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{dateColumn.name} (x-axis)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {numericColumns.map(numCol => (
                      <Button 
                        key={`time-${dateColumn.name}-${numCol.name}`}
                        variant={selectedChartTypes[`${dateColumn.name}-${numCol.name}`] === 'timeseries' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => toggleChartType(`${dateColumn.name}-${numCol.name}`, 'timeseries')}
                        className="flex items-center gap-1"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        {numCol.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {numericColumns.length === 0 && categoricalColumns.length === 0 && dateColumns.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            No suitable columns for visualization. Select numeric, categorical, or date columns.
          </div>
        )}
      </div>
    );
  };
  
  // Toggle selected chart type
  const toggleChartType = (columnKey: string, chartType: string) => {
    setSelectedChartTypes(prev => {
      // If this chart type is already selected, deselect it
      if (prev[columnKey] === chartType) {
        const newState = { ...prev };
        delete newState[columnKey];
        return newState;
      }
      
      // Otherwise, select this chart type
      return {
        ...prev,
        [columnKey]: chartType
      };
    });
  };
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Prepare data for pie chart
  const preparePieChartData = (columnKey: string, data: any[]) => {
    if (!data.length) return [];
    
    const counts: Record<string, number> = {};
    
    // Count occurrences of each value
    data.forEach(row => {
      const value = String(row[columnKey]);
      counts[value] = (counts[value] || 0) + 1;
    });
    
    // Convert to array of objects for the chart
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const renderTimeSeriesChart = (dateColumn: string, numericColumn: string, data: any[]) => {
    if (!data.length) return null;
    
    // Sort the data by date for time series
    const chartData = [...data].sort((a, b) => {
      return new Date(a[dateColumn]).getTime() - new Date(b[dateColumn]).getTime();
    });
    
    return (
      <div key={`timeseries-${dateColumn}-${numericColumn}`} className="border rounded-lg p-4 bg-white">
        <h4 className="text-sm font-medium mb-4">Time Series: {dateColumn} vs {numericColumn}</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={dateColumn} 
              tickFormatter={(tick) => {
                const date = new Date(tick);
                return date.toLocaleDateString();
              }}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={numericColumn} 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = (columnKey: string, data: any[]) => {
    if (!data.length) return null;
    
    // For numeric columns, create a frequency distribution
    const isNumeric = typeof data[0][columnKey] === 'number';
    
    let chartData;
    if (isNumeric) {
      // Create buckets for numeric data
      const values = data.map(row => row[columnKey]).filter(val => val !== null);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const bucketCount = Math.min(10, range);
      const bucketSize = range / bucketCount;
      
      // Initialize buckets
      const buckets: Record<string, number> = {};
      for (let i = 0; i < bucketCount; i++) {
        const bucketMin = min + (i * bucketSize);
        const bucketMax = bucketMin + bucketSize;
        buckets[`${bucketMin.toFixed(1)} - ${bucketMax.toFixed(1)}`] = 0;
      }
      
      // Count values in each bucket
      values.forEach(value => {
        const bucketIndex = Math.min(
          bucketCount - 1, 
          Math.floor((value - min) / bucketSize)
        );
        const bucketMin = min + (bucketIndex * bucketSize);
        const bucketMax = bucketMin + bucketSize;
        const label = `${bucketMin.toFixed(1)} - ${bucketMax.toFixed(1)}`;
        buckets[label]++;
      });
      
      chartData = Object.entries(buckets).map(([name, value]) => ({ name, value }));
    } else {
      // For non-numeric, use the preparePieChartData function for counts
      chartData = preparePieChartData(columnKey, data);
    }
    
    return (
      <div key={`bar-${columnKey}`} className="border rounded-lg p-4 bg-white">
        <h4 className="text-sm font-medium mb-4">Bar Chart: {columnKey}</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = (columnKey: string, data: any[]) => {
    if (!data.length) return null;
    
    // For numeric columns, create a line chart
    const values = data.map(row => row[columnKey]).filter(val => val !== null);
    
    // Sort the values
    values.sort((a, b) => a - b);
    
    // Create data points with indices as x-axis
    const chartData = values.map((value, index) => ({
      index,
      value
    }));
    
    return (
      <div key={`line-${columnKey}`} className="border rounded-lg p-4 bg-white">
        <h4 className="text-sm font-medium mb-4">Line Chart: {columnKey}</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = (columnKey: string, data: any[]) => {
    if (!data.length) return null;
    
    const chartData = preparePieChartData(columnKey, data);
    
    return (
      <div key={`pie-${columnKey}`} className="border rounded-lg p-4 bg-white">
        <h4 className="text-sm font-medium mb-4">Pie Chart: {columnKey}</h4>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({percent}) => {
                // Always show the percentage, but truncate the name if needed
                return `${(percent * 100).toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render the actual charts based on user selection
  const renderSelectedCharts = () => {
    if (Object.keys(selectedChartTypes).length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Select chart types from the options above to visualize your data
        </div>
      );
    }
    
    console.log('Rendering charts with selected types:', selectedChartTypes); // Log selected chart types
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {Object.entries(selectedChartTypes).map(([columnKey, chartType]) => {
          // Handle time series charts (which have composite keys)
          if (chartType === 'timeseries') {
            const [dateColumn, numericColumn] = columnKey.split('-');
            return renderTimeSeriesChart(dateColumn, numericColumn, fullDataset);
          }
          
          // Handle regular charts
          switch (chartType) {
            case 'bar':
              return renderBarChart(columnKey, fullDataset);
            case 'line':
              return renderLineChart(columnKey, fullDataset);
            case 'pie':
              return renderPieChart(columnKey, fullDataset);
            default:
              return null;
          }
        })}
      </div>
    );
  };
  
  // Updated visualizations tab content
  const renderVisualizationsTab = () => {
    if (fullDataLoading) {
      return (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="border rounded-lg bg-white">
          <div 
            className="p-4 border-b flex items-center justify-between cursor-pointer"
            onClick={() => setChartOptionsExpanded(!chartOptionsExpanded)}
          >
            <h3 className="text-lg font-medium">Chart Options</h3>
            <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
              {chartOptionsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div style={{ display: chartOptionsExpanded ? 'block' : 'none' }}>
            {renderChartOptions()}
          </div>
        </div>
        
        {renderSelectedCharts()}
      </div>
    );
  };
  
  // Add this useEffect to reset chart state when the table changes
  useEffect(() => {
    // Reset chart state when table changes
    setSelectedChartTypes({});
    setFullDataset([]);
    setChartOptionsExpanded(true);
  }, [tableName]);
  
  if (loading && page === 1) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            className="pl-8"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button 
              className="absolute right-2 top-2.5"
              onClick={() => setSearchText('')}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === "data" ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1" 
              onClick={handleRefreshData}
              disabled={isRefreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1" 
              onClick={fetchFullDataForCharts}
              disabled={fullDataLoading}
            >
              <RefreshCw className={`h-4 w-4 ${fullDataLoading ? 'animate-spin' : ''}`} />
              {fullDataLoading ? 'Refreshing...' : 'Refresh Charts'}
            </Button>
          )}
          
          {/* Add Clear Filters button that shows only when filters are applied */}
          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={handleClearFilters}
              disabled={loading || isRefreshing || fullDataLoading}
            >
              <FilterX className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
          
          <span className="text-sm text-muted-foreground">
            {activeFilters.length > 0 ? `${activeFilters.length} active filters` : 'No filters'}
          </span>
          
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-0 bg-white border shadow-md" 
              align="end"
            >
              <div className="p-4 border-b">
                <h4 className="font-medium text-sm">Filter Columns</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Set conditions to filter the results.
                </p>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
                {columns.map((column) => (
                  <div key={column.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{column.name}</span>
                      {pendingFilters[column.name] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => clearPendingFilter(column.name)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Clear filter</span>
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={pendingFilters[column.name]?.operator || 'equals'}
                        onValueChange={(value) => handleUpdatePendingOperator(
                          column.name,
                          value as any
                        )}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForColumnType(column).map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderFilterInput(column)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setPendingFilters({});
                    setFilterOpen(false);
                    setFilters({});
                    setActiveFilters([]);
                  }}
                  disabled={Object.keys(pendingFilters).length === 0}
                >
                  Clear All
                </Button>
                <Button 
                  size="sm"
                  onClick={handleApplyFilters}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Tabs Interface */}
      <Tabs 
        defaultValue="data" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-[200px] mb-4">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            <span>Data</span>
          </TabsTrigger>
          <TabsTrigger value="visualizations" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            <span>Charts</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="mt-0">
          {renderDataTab()}
        </TabsContent>
        
        <TabsContent value="visualizations" className="mt-0">
          {renderVisualizationsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QueryResults; 