import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { MainContent } from './MainContent';
import { ModalsContainer } from './ModalsContainer';
import { useDataSources } from '@/hooks/useDataSources';
import { useQueryState } from '@/hooks/useQueryState';
import { AnimatePresence } from 'framer-motion';
import { DatabaseTable } from '../types/dataSource';
import { getTablesForDataSource } from '@/services/tableService';
import { Column } from '@/services/queryService';
import BasicView from './BasicView';

export const AppContainer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  const [tableError, setTableError] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<DatabaseTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState<boolean>(false);
  const [selectedTableColumns, setSelectedTableColumns] = useState<Column[]>([]);
  
  const {
    dataSources,
    selectedDataSource,
    loading,
    handleSelectDataSource,
    handleAddDataSource,
    handleDeleteDataSource,
    handleEditDataSource,
    handleUpdateDataSource,
    modalOpen,
    setModalOpen,
    editModalOpen,
    setEditModalOpen,
    dataSourceToEdit,
    deletingId
  } = useDataSources();

  const {
    selectedTable,
    selectedColumns,
    handleSelectColumns,
    handleSelectTable
  } = useQueryState(selectedDataSource);

  // Fetch tables when data source changes
  useEffect(() => {
    if (selectedDataSource) {
      setTablesLoading(true);
      setAvailableTables([]);
      setTableError(null);
      
      getTablesForDataSource(Number(selectedDataSource.id))
        .then(tables => {
          setAvailableTables(tables);
          setTablesLoading(false);
        })
        .catch(error => {
          console.error("Error fetching tables:", error);
          setTableError("Failed to load tables from data source");
          setTablesLoading(false);
        });
    }
  }, [selectedDataSource]);

  // Handle table selection from basic view
  const handleTableSelect = (table: DatabaseTable) => {
    // Find the selected table from available tables
    const selectedTableData = availableTables.find(t => t.name === table.name);
    
    // If table is found, update the state
    if (selectedTableData) {
      // Update the selectedTable in useQueryState
      handleSelectTable(selectedTableData.name);
      
      // Convert DatabaseTable columns to the format expected by QueryResults
      const formattedColumns: Column[] = selectedTableData.columns.map(column => ({
        name: column.name,
        dataType: column.dataType,
        friendlyType: column.friendlyType || "Text", // Default to Text if not specified
        nullable: column.nullable
      }));
      
      // Store the columns for the QueryResults component
      setSelectedTableColumns(formattedColumns);
    }
  };

  // Reset selected table when switching between view modes
  useEffect(() => {
    if (viewMode === 'basic') {
      // When switching to basic view, clear any selected table
      if (selectedTable) {
        handleSelectTable('');
        setSelectedTableColumns([]);
      }
    }
  }, [viewMode]);

  // NEW EFFECT: Reset selected table when data source changes
  useEffect(() => {
    // Reset the selected table and columns when data source changes
    handleSelectTable('');
    setSelectedTableColumns([]);
    setTableError(null);
  }, [selectedDataSource]);

  const handleResetTable = () => {
    handleSelectTable('');
    setSelectedTableColumns([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header 
        onAddDataSourceClick={() => setModalOpen(true)}
        onEditDataSourceClick={handleEditDataSource}
        onSelectDataSource={handleSelectDataSource}
        onDeleteDataSource={handleDeleteDataSource}
        dataSources={dataSources}
        selectedDataSource={selectedDataSource}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedTable={selectedTable}
      />
      
      <AnimatePresence>
        {viewMode === 'advanced' ? (
          <MainContent
            loading={loading}
            dataSources={dataSources}
            selectedDataSource={selectedDataSource}
            selectedTable={selectedTable}
            selectedColumns={selectedColumns}
            deletingId={deletingId}
            onAddClick={() => setModalOpen(true)}
            onSelectColumns={handleSelectColumns}
          />
        ) : (
          <BasicView
            selectedDataSource={selectedDataSource}
            availableTables={availableTables}
            tablesLoading={tablesLoading}
            tableError={tableError}
            selectedTable={selectedTable}
            selectedTableColumns={selectedTableColumns}
            onSelectTable={handleTableSelect}
            onResetTable={handleResetTable}
            onError={setTableError}
          />
        )}
      </AnimatePresence>

      <ModalsContainer
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        dataSourceToEdit={dataSourceToEdit}
        onAddDataSource={handleAddDataSource}
        onUpdateDataSource={handleUpdateDataSource}
      />
    </div>
  );
}; 