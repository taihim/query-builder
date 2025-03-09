import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DataSource, DataSourceType } from '@/types/dataSource';
import { testDataSourceConnection } from '@/services/dataSourceService';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditDataSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSource: DataSource | null;
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

export const EditDataSourceModal: React.FC<EditDataSourceModalProps> = ({ 
  open, 
  onOpenChange,
  dataSource,
  onUpdateDataSource
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<DataSourceType>('postgres');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form when the modal opens with a data source
  useEffect(() => {
    if (open && dataSource) {
      setName(dataSource.name);
      setType(dataSource.type);
      
      // Parse host and port from the combined host string
      const hostParts = dataSource.host ? dataSource.host.split(':') : ['', ''];
      setHost(hostParts[0]); // Set just the hostname part
      setPort(hostParts[1] || dataSource.port?.toString() || ''); // Set the port part
      
      setDatabase(dataSource.database || '');
      setUsername(dataSource.username || '');
      // Don't set password - we'll require them to enter it again for security
      setPassword('');
      
      // Reset status
      setTestConnectionStatus('idle');
      setErrorMessage('');
    }
  }, [open, dataSource]);

  const handleTestConnection = async () => {
    try {
      setTestConnectionStatus('testing');
      setErrorMessage('');
      
      const isConnected = await testDataSourceConnection(
        type,
        host,
        port,
        database,
        username,
        password
      );
      
      if (isConnected) {
        setTestConnectionStatus('success');
      } else {
        setTestConnectionStatus('error');
        setErrorMessage('Could not connect to the database. Please check your credentials.');
      }
    } catch (error) {
      setTestConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataSource) return;
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // First test connection before saving
      const isConnected = await testDataSourceConnection(
        type,
        host,
        port,
        database,
        username,
        password
      );
      
      if (!isConnected) {
        setErrorMessage('Cannot update data source: connection test failed');
        setTestConnectionStatus('error');
        return;
      }
      
      await onUpdateDataSource(
        dataSource.id,
        name, 
        type, 
        host, 
        port, 
        database, 
        username, 
        password
      );
      
      // Reset form and close modal on success
      resetForm();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update data source');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('postgres');
    setHost('');
    setPort('');
    setDatabase('');
    setUsername('');
    setPassword('');
    setTestConnectionStatus('idle');
    setErrorMessage('');
  };

  const isFormValid = name && type && host && port && database && username && password;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Data Source</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Database"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div className="col-span-4">
              <Label htmlFor="type">Database Type</Label>
              <Select
                value={type}
                onValueChange={(value: DataSourceType) => setType(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgres">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-3">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                placeholder="localhost"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div className="col-span-1">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder="5432"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div className="col-span-4">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                placeholder="mydatabase"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password again"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          
          {/* Connection test status */}
          {testConnectionStatus !== 'idle' && (
            <div className={cn(
              "p-3 rounded-md text-sm flex items-center gap-2",
              testConnectionStatus === 'testing' && "bg-blue-50 text-blue-700",
              testConnectionStatus === 'success' && "bg-green-50 text-green-700",
              testConnectionStatus === 'error' && "bg-red-50 text-red-700"
            )}>
              {testConnectionStatus === 'testing' && "Testing connection..."}
              {testConnectionStatus === 'success' && (
                <>
                  <CheckCircle2 className="h-4 w-4" /> 
                  Connection successful! You can now save the changes.
                </>
              )}
              {testConnectionStatus === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4" /> 
                  {errorMessage || "Connection failed. Please check your credentials."}
                </>
              )}
            </div>
          )}
          
          {errorMessage && testConnectionStatus !== 'error' && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> 
              {errorMessage}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isLoading || !isFormValid || testConnectionStatus === 'testing'}
              className="mr-2"
            >
              Test Connection
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || 
                !isFormValid || 
                testConnectionStatus === 'testing' ||
                testConnectionStatus !== 'success'
              }
            >
              {isLoading ? 'Updating...' : 'Update Data Source'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 