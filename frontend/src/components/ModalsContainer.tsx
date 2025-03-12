import React from 'react';
import { DataSource, DataSourceType } from '@/types/dataSource';
import { AddDataSourceModal } from './AddDataSourceModal';
import { EditDataSourceModal } from './EditDataSourceModal';

interface ModalsContainerProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  dataSourceToEdit: DataSource | null;
  onAddDataSource: (
    name: string,
    type: DataSourceType,
    host: string, 
    port: string, 
    database: string,
    username: string,
    password: string
  ) => Promise<void>;
  onUpdateDataSource: (
    id: string,
    name: string, 
    type: DataSourceType, 
    host: string, 
    port: string, 
    database: string, 
    username: string, 
    password: string
  ) => Promise<void>;
}

export const ModalsContainer: React.FC<ModalsContainerProps> = ({
  modalOpen,
  setModalOpen,
  editModalOpen,
  setEditModalOpen,
  dataSourceToEdit,
  onAddDataSource,
  onUpdateDataSource,
}) => {
  return (
    <>
      <AddDataSourceModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onAddDataSource={onAddDataSource}
      />

      <EditDataSourceModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen}
        dataSource={dataSourceToEdit}
        onUpdateDataSource={onUpdateDataSource}
      />
    </>
  );
}; 