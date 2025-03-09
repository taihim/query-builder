import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AddDataSourceModal } from './components/AddDataSourceModal';
import { Layout } from './components/Layout';
import { getDataSources, addDataSource, deleteDataSource, updateDataSource } from './services/dataSourceService';
import { DataSource, DataSourceType, TableColumn } from './types/dataSource';
import QueryResults from './components/QueryResults';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EditDataSourceModal } from './components/EditDataSourceModal';
import './styles/custom.css';

const App: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Query state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<TableColumn[]>([]);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [dataSourceToEdit, setDataSourceToEdit] = useState<DataSource | null>(null);
  
  useEffect(() => {
    const loadDataSourcesAndState = async () => {
      try {
        setLoading(true);
        
        // Load all data sources
        const sources = await getDataSources();
        setDataSources(sources);
        
        // Try to restore previous state from localStorage
        const savedDataSourceId = localStorage.getItem('selectedDataSourceId');
        const savedTableName = localStorage.getItem('selectedTable');
        const savedColumnsString = localStorage.getItem('selectedColumns');
        let savedColumns: TableColumn[] = [];
        
        if (savedColumnsString) {
          try {
            savedColumns = JSON.parse(savedColumnsString);
          } catch (e) {
            console.error('Error parsing saved columns:', e);
          }
        }
        
        // Default source selection logic
        if (sources.length > 0) {
          let sourceToSelect: DataSource;
          
          if (savedDataSourceId) {
            // Try to find the previously selected source
            const previousSource = sources.find(ds => ds.id === savedDataSourceId);
            
            if (previousSource) {
              sourceToSelect = previousSource;
              
              // If we have a saved table and columns, restore those too
              if (savedTableName) {
                setSelectedTable(savedTableName);
                
                if (savedColumns.length > 0) {
                  setSelectedColumns(savedColumns);
                }
              }
            } else {
              // If saved source not found, use first available
              sourceToSelect = sources[0];
              // Clear the invalid saved ID
              localStorage.removeItem('selectedDataSourceId');
            }
          } else {
            // No saved state, select first source
            sourceToSelect = sources[0];
            // Save this selection as default
            localStorage.setItem('selectedDataSourceId', sourceToSelect.id);
          }
          
          // Set the selected data source
          setSelectedDataSource(sourceToSelect);
          
          // If no table is selected but we have a source, save the source ID
          if (!savedTableName) {
            localStorage.setItem('selectedDataSourceId', sourceToSelect.id);
          }
        }
      } catch (error) {
        console.error('Error loading data sources:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDataSourcesAndState();
  }, []);

  const handleAddDataSource = async (
    name: string, 
    type: DataSourceType, 
    host: string, 
    port: string, 
    database: string,
    username: string,
    password: string
  ) => {
    try {
      setLoading(true);
      const newDataSource = await addDataSource(name, type, host, port, database, username, password);
      
      // Update data sources list
      setDataSources(prev => [...prev, newDataSource]);
      
      // Select the new data source
      setSelectedDataSource(newDataSource);
      
      // Reset query state when adding a new data source
      setSelectedTable(null);
      setSelectedColumns([]);
      
      // Update localStorage with new data source ID
      localStorage.setItem('selectedDataSourceId', newDataSource.id);
      
      // Clear table and column selections from localStorage
      localStorage.removeItem('selectedTable');
      localStorage.removeItem('selectedColumns');
      
      // Clear any saved filters for previous data sources
      // Find and remove all queryFilters entries
      Object.keys(localStorage)
        .filter(key => key.startsWith('queryFilters-'))
        .forEach(key => localStorage.removeItem(key));
      
      // Reset any expanded tables/columns state
      localStorage.removeItem('expandedTables');
      localStorage.removeItem('expandedColumns');
      
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to add data source:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDataSource = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource);
    localStorage.setItem('selectedDataSourceId', dataSource.id);
    
    // Reset query state when changing data sources
    setSelectedTable(null);
    setSelectedColumns([]);
    localStorage.removeItem('selectedTable');
    localStorage.removeItem('selectedColumns');
  };

  const handleSelectColumns = (tableName: string, columns: TableColumn[]) => {
    setSelectedTable(tableName);
    setSelectedColumns(columns);
    localStorage.setItem('selectedTable', tableName);
    localStorage.setItem('selectedColumns', JSON.stringify(columns));
  };

  const handleDeleteDataSource = async (id: string) => {
    try {
      // Set the id of the data source being deleted for animation
      setDeletingId(id);
      
      // Wait for animation to complete (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Delete from server
      await deleteDataSource(id);
      
      // Update local state
      setDataSources(prev => prev.filter(ds => ds.id !== id));
      
      // If the deleted source was selected, select the first available one or null
      if (selectedDataSource?.id === id) {
        const remainingDataSources = dataSources.filter(ds => ds.id !== id);
        setSelectedDataSource(remainingDataSources.length > 0 ? remainingDataSources[0] : null);
        setSelectedTable(null);
        setSelectedColumns([]);
      }
    } catch (error) {
      console.error('Failed to delete data source:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditDataSource = (dataSource: DataSource) => {
    setDataSourceToEdit(dataSource);
    setEditModalOpen(true);
  };

  const handleUpdateDataSource = async (
    id: string,
    name: string, 
    type: DataSourceType, 
    host: string, 
    port: string, 
    database: string, 
    username: string, 
    password: string
  ) => {
    try {
      setLoading(true);
      const updatedDataSource = await updateDataSource(
        id, name, type, host, port, database, username, password
      );
      
      // Update the data sources list
      setDataSources(prev => prev.map(ds => 
        ds.id === id ? updatedDataSource : ds
      ));
      
      // If the updated source was selected, update the selection
      if (selectedDataSource?.id === id) {
        setSelectedDataSource(updatedDataSource);
      }
      
      setEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update data source:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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
      />
      
      <AnimatePresence>
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex h-[calc(100vh-4rem)] items-center justify-center"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </motion.div>
        ) : dataSources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
              <div className="text-center space-y-6 p-8">
                <h2 className="text-2xl font-semibold">No Data Sources</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Connect to a database to get started building queries
                </p>
                <div className="relative mt-8 inline-block">
                  <Button 
                    onClick={() => setModalOpen(true)}
                    size="lg"
                    className="relative z-10"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Your First Data Source
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={deletingId === selectedDataSource?.id ? "animate-shake" : ""}
          >
            <Layout 
              selectedDataSource={selectedDataSource}
              selectedTable={selectedTable}
              selectedColumns={selectedColumns}
              onSelectColumns={handleSelectColumns}
            >
              <div className="container p-8">
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedTable 
                    ? `Table: ${selectedTable}`
                    : selectedDataSource 
                      ? `${selectedDataSource.name} Dashboard` 
                      : 'Select a Data Source'
                  }
                </h2>
                <p className="mb-6 text-muted-foreground">
                  {selectedTable
                    ? `Use the sidebar to select columns for your query`
                    : selectedDataSource 
                      ? 'Click on a table in the sidebar to explore its columns' 
                      : 'Choose a data source from the dropdown to start working'
                  }
                </p>
                
                {selectedTable && selectedColumns.length > 0 && selectedDataSource && (
                  <QueryResults 
                    dataSourceId={Number(selectedDataSource.id)}
                    tableName={selectedTable}
                    columns={selectedColumns}
                  />
                )}
              </div>
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>

      <AddDataSourceModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onAddDataSource={handleAddDataSource}
      />

      <EditDataSourceModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen}
        dataSource={dataSourceToEdit}
        onUpdateDataSource={handleUpdateDataSource}
      />
    </div>
  );
};

export default App; 