import React from 'react';
import { Header } from './Header';
import { MainContent } from './MainContent';
import { ModalsContainer } from './ModalsContainer';
import { useDataSources } from '@/hooks/useDataSources';
import { useQueryState } from '@/hooks/useQueryState';
import { AnimatePresence } from 'framer-motion';

export const AppContainer: React.FC = () => {
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
    handleSelectColumns
  } = useQueryState(selectedDataSource);

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