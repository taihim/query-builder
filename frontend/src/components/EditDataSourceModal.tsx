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
  const [type, setType] = useState<DataSourceType>('mysql');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load data source when modal opens
  useEffect(() => {
    if (dataSource && open) {
      setName(dataSource.name || '');
      setType(dataSource.type || 'mysql');
      setHost(dataSource.host || '');
      setPort(dataSource.port ? dataSource.port.toString() : '');
      setDatabase(dataSource.database || '');
      setUsername(dataSource.username || '');
      setPassword(''); // Don't populate password for security reasons
      setStatus('idle');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [dataSource, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataSource) return;
    
    // Validate port is within valid range
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setErrorMessage('Port must be a number between 1 and 65535');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      setStatus('testing');
      setSuccessMessage('Testing connection...');
      
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
        setErrorMessage('Connection failed. Please check your database credentials and try again.');
        setStatus('error');
        setSuccessMessage('');
        setIsLoading(false);
        return;
      }
      
      // Connection successful, proceed with update
      setStatus('success');
      setSuccessMessage('Connection successful! Updating data source...');
      
      await onUpdateDataSource(
        dataSource.id || '',
        name, 
        type, 
        host, 
        port, 
        database, 
        username, 
        password
      );
      
      // Show success message briefly before closing
      setSuccessMessage('Data source updated successfully!');
      
      // Close the modal after a delay
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1500);
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update data source');
      setStatus('error');
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('mysql');
    setHost('');
    setPort('');
    setDatabase('');
    setUsername('');
    setPassword('');
    setStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const isFormValid = 
    name.trim() !== '' && 
    host.trim() !== '' && 
    port.trim() !== '' && 
    database.trim() !== '' && 
    username.trim() !== '';

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
                  <SelectItem value="mysql">MySQL</SelectItem>
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
                type="number"
                placeholder="3306"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="mt-1 hide-spinners"
                min="1"
                max="65535"
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
          
          {/* Status message area */}
          {(status !== 'idle' || errorMessage) && (
            <div className={cn(
              "p-3 rounded-md text-sm flex items-center gap-2",
              status === 'testing' && "bg-blue-50 text-blue-700",
              status === 'success' && "bg-green-50 text-green-700",
              status === 'error' && "bg-red-50 text-red-700"
            )}>
              {status === 'testing' && successMessage}
              {status === 'success' && (
                <>
                  <CheckCircle2 className="h-4 w-4" /> 
                  {successMessage}
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4" /> 
                  {errorMessage}
                </>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? 'Updating...' : 'Update Data Source'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 