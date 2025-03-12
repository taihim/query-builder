import { AlertCircle, Database, Table } from 'lucide-react';
import { DatabaseTable } from '../types/dataSource';
import { Column } from '@/services/queryService';
import TableSearchInput from './TableSearchInput';
import BasicQueryResults from './BasicQueryResults';

interface BasicViewProps {
  selectedDataSource: any;
  availableTables: DatabaseTable[];
  tablesLoading: boolean;
  tableError: string | null;
  selectedTable: string | null;
  selectedTableColumns: Column[];
  onSelectTable: (table: DatabaseTable) => void;
  onResetTable: () => void;
  onError: (error: string | null) => void;
}

const BasicView: React.FC<BasicViewProps> = ({
  selectedDataSource,
  availableTables,
  tablesLoading,
  tableError,
  selectedTable,
  selectedTableColumns,
  onSelectTable,
  onError
}) => {
  return (
    <div className="flex flex-1 flex-col items-center p-8 max-w-5xl mx-auto w-full">            
      {!selectedDataSource ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 rounded-lg w-full mb-6">
          <Database className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-600 text-center">
            Please select a data source from the dropdown in the header
          </p>
        </div>
      ) : (
        <>
          {tableError && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4 w-full border border-red-300">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                Error
              </div>
              <p className="mt-1 text-sm">{tableError}</p>
            </div>
          )}

          {tablesLoading ? (
            <div className="flex items-center justify-center p-8 w-full">
              <p className="text-gray-600">Loading tables...</p>
            </div>
          ) : (
            <TableSearchInput 
              availableTables={availableTables}
              tablesLoading={tablesLoading}
              onSelectTable={onSelectTable}
              onError={onError}
            />
          )}

          {selectedTable && (
            <div className="w-full mt-4">
              <div className="space-y-4 w-full">
                <div className="flex items-center gap-2 mb-4">
                  <Table className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Query Results for {selectedTable}</h3>
                </div>
                
                {selectedTableColumns.length > 0 ? (
                  <BasicQueryResults
                    dataSourceId={Number(selectedDataSource.id)}
                    tableName={selectedTable as string} 
                    columns={selectedTableColumns}
                  />
                ) : (
                  <div className="flex justify-center items-center p-12 border rounded-md">
                    <p className="text-gray-500">No columns available for this table</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BasicView; 