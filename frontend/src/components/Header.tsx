import React, { useState } from 'react';
import { ChevronDown, Database, Plus, Trash2, Edit, Layout, Table } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { ConfirmationDialog } from './ConfirmationDialog';
import { DataSource, DatabaseTable } from '../types/dataSource';

interface HeaderProps {
  onAddDataSourceClick: () => void;
  onEditDataSourceClick: (dataSource: DataSource) => void;
  onSelectDataSource: (dataSource: DataSource) => void;
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  onDeleteDataSource: (id: string) => Promise<void>;
  viewMode: 'basic' | 'advanced';
  setViewMode: (mode: 'basic' | 'advanced') => void;
  selectedTable: DatabaseTable | string | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  onAddDataSourceClick, 
  onEditDataSourceClick,
  onSelectDataSource,
  dataSources,
  selectedDataSource,
  onDeleteDataSource,
  viewMode,
  setViewMode,
  selectedTable
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState<DataSource | null>(null);

  const handleDeleteClick = (dataSource: DataSource, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the dropdown item click
    setDataSourceToDelete(dataSource);
    setDeleteDialogOpen(true);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'advanced' ? 'basic' : 'advanced');
  };

  // Helper function to get the table name regardless of type
  const getTableName = () => {
    if (!selectedTable) return '';
    return typeof selectedTable === 'string' ? selectedTable : selectedTable.name;
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 lg:px-6">
      <div className="w-full flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">QueryBuilder</h1>
          
          {viewMode === 'basic' && selectedTable && (
            <div className="flex items-center ml-4 pl-4 border-l">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Table className="h-4 w-4 text-primary" />
                <span>Table:</span>
                <span className="font-bold text-primary">{getTableName()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center gap-1 ${viewMode === 'advanced' ? 'bg-primary/10 text-primary' : ''}`}
            onClick={toggleViewMode}
          >
            <Layout className="h-4 w-4" />
            <span>{viewMode === 'advanced' ? 'Advanced View' : 'Basic View'}</span>
          </Button>
          
          {dataSources.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-between">
                  <span className="flex items-center">
                    <Database className="mr-2 h-4 w-4" />
                    {selectedDataSource?.name || "Select data source"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[280px]">
                {dataSources.map((source) => (
                  <DropdownMenuItem
                    key={source.id}
                    onClick={() => onSelectDataSource(source)}
                    className="cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center flex-1 min-w-0 mr-2">
                      <Database className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{source.name}</span>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDataSourceClick(source);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:scale-110"
                        onClick={(e) => handleDeleteClick(source, e)}
                        title="Delete data source"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onAddDataSourceClick}
                  className="cursor-pointer text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new data source
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Data Source"
        description={`Are you sure you want to delete "${dataSourceToDelete?.name}"? This action cannot be undone.`}
        onConfirm={() => dataSourceToDelete && onDeleteDataSource(dataSourceToDelete.id)}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
      />
    </header>
  );
}; 