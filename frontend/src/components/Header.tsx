import React, { useState } from 'react';
import { ChevronDown, Database, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { ConfirmationDialog } from './ConfirmationDialog';
import { DataSource } from '../types/dataSource';

interface HeaderProps {
  onAddDataSourceClick: () => void;
  onEditDataSourceClick: (dataSource: DataSource) => void;
  onSelectDataSource: (dataSource: DataSource) => void;
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  onDeleteDataSource: (id: string) => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ 
  onAddDataSourceClick, 
  onEditDataSourceClick,
  onSelectDataSource,
  dataSources,
  selectedDataSource,
  onDeleteDataSource
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState<DataSource | null>(null);

  const handleDeleteClick = (dataSource: DataSource, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the dropdown item click
    setDataSourceToDelete(dataSource);
    setDeleteDialogOpen(true);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 lg:px-6">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">QueryBuilder</h1>
        </div>

        <div className="ml-auto">
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