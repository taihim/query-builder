import React, { useState, useEffect } from 'react';
import { TableExplorer } from './TableExplorer';
import { DataSource, TableColumn } from '@/types/dataSource';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
  selectedDataSource: DataSource | null;
  selectedTable: string | null;
  selectedColumns: TableColumn[];
  onSelectColumns: (tableName: string, columns: TableColumn[]) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  selectedDataSource,
  selectedTable,
  selectedColumns,
  onSelectColumns
}) => {
  // Initialize with a default state, then update in useEffect
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Load sidebar state on component mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setIsSidebarCollapsed(JSON.parse(savedState));
        console.log('Loaded sidebar state:', JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
  }, []);
  
  // Save sidebar state whenever it changes
  useEffect(() => {
    try {
      console.log('Saving sidebar state:', isSidebarCollapsed);
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  }, [isSidebarCollapsed]);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className={`
        relative transition-all duration-300 ease-in-out border-r bg-gray-50
        ${isSidebarCollapsed ? 'w-16' : 'w-80'}
      `}>
        <div className={`p-4 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          {!isSidebarCollapsed && (
            <TableExplorer 
              selectedDataSource={selectedDataSource}
              selectedTable={selectedTable}
              selectedColumns={selectedColumns}
              onSelectColumns={onSelectColumns} 
            />
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute right-[-12px] top-4 h-6 w-6 rounded-full border bg-white shadow-md"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}; 