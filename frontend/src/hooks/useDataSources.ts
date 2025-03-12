import { useState, useEffect } from 'react';
import { 
  getDataSources, 
  addDataSource, 
  deleteDataSource, 
  updateDataSource 
} from '../services/dataSourceService';
import { DataSource, DataSourceType } from '../types/dataSource';

export const useDataSources = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [dataSourceToEdit, setDataSourceToEdit] = useState<DataSource | null>(null);

  useEffect(() => {
    const loadDataSources = async () => {
      try {
        setLoading(true);
        const sources = await getDataSources();
        setDataSources(sources);
        
        const savedDataSourceId = localStorage.getItem('selectedDataSourceId');
        
        if (sources.length > 0) {
          let sourceToSelect: DataSource;
          
          if (savedDataSourceId) {
            const previousSource = sources.find(ds => ds.id === savedDataSourceId);
            sourceToSelect = previousSource || sources[0];
            
            if (!previousSource) {
              localStorage.removeItem('selectedDataSourceId');
            }
          } else {
            sourceToSelect = sources[0];
            localStorage.setItem('selectedDataSourceId', sourceToSelect.id);
          }
          
          setSelectedDataSource(sourceToSelect);
        }
      } catch (error) {
        console.error('Error loading data sources:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDataSources();
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
      
      setDataSources(prev => [...prev, newDataSource]);
      setSelectedDataSource(newDataSource);
      
      localStorage.setItem('selectedDataSourceId', newDataSource.id);
      localStorage.removeItem('selectedTable');
      localStorage.removeItem('selectedColumns');
      
      // Clear any saved filters
      Object.keys(localStorage)
        .filter(key => key.startsWith('queryFilters-'))
        .forEach(key => localStorage.removeItem(key));
      
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
    localStorage.removeItem('selectedTable');
    localStorage.removeItem('selectedColumns');
  };

  const handleDeleteDataSource = async (id: string) => {
    try {
      setDeletingId(id);
      await new Promise(resolve => setTimeout(resolve, 500));
      await deleteDataSource(id);
      
      setDataSources(prev => prev.filter(ds => ds.id !== id));
      
      if (selectedDataSource?.id === id) {
        const remainingDataSources = dataSources.filter(ds => ds.id !== id);
        setSelectedDataSource(remainingDataSources.length > 0 ? remainingDataSources[0] : null);
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
      
      setDataSources(prev => prev.map(ds => 
        ds.id === id ? updatedDataSource : ds
      ));
      
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

  return {
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
  };
}; 