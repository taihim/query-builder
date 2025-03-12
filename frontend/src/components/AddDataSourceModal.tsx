import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DataSourceType } from '@/types/dataSource';
import { testDataSourceConnection } from '@/services/dataSourceService';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddDataSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDataSource: (name: string, type: DataSourceType, host: string, port: string, database: string, username: string, password: string) => void;
}

export const AddDataSourceModal: React.FC<AddDataSourceModalProps> = ({
  open,
  onOpenChange,
  onAddDataSource,
}) => {
  const [name, setName] = useState('');
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('mysql');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [db_user, setUser] = useState('');
  const [db_password, setPwd] = useState('');
  const [database, setDatabase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset test result and form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // If modal closes, reset the test result and form data
      setTestResult(null);
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate port is within valid range
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setTestResult({
        success: false,
        message: 'Port must be a number between 1 and 65535'
      });
      return;
    }
    
    setIsSubmitting(true);
    setTestResult(null);
    
    try {
      // First test connection before saving
      const isConnected = await testDataSourceConnection(
        dataSourceType,
        host,
        port,
        database,
        db_user,
        db_password
      );
      
      if (!isConnected) {
        setTestResult({
          success: false,
          message: 'Connection failed. Please check your database credentials and try again.'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Connection successful, proceed with adding
      setTestResult({
        success: true,
        message: 'Connection successful! Adding data source...'
      });
      
      await onAddDataSource(
        name, 
        dataSourceType, 
        host, 
        port, 
        database, 
        db_user, 
        db_password
      );
      
      // Show success message briefly before closing
      setTestResult({
        success: true,
        message: 'Data source added successfully!'
      });
      
      // Close the modal after a delay
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1500);
      
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add data source'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDataSourceType('mysql');
    setHost('');
    setPort('');
    setUser('');
    setPwd('');
    setDatabase('');
    setTestResult(null);
  };

  const isFormValid = 
    name.trim() !== '' && 
    host.trim() !== '' && 
    port.trim() !== '' && 
    db_user.trim() !== '' && 
    database.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Add New Data Source
          </DialogTitle>
          <DialogDescription>
            Connect to a new database to start querying your data.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My Database"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Database Type</Label>
            <Select
              value={dataSourceType}
              onValueChange={(value) => setDataSourceType(value as DataSourceType)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select Database Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mssql">MSSQL</SelectItem>
              </SelectContent>1
            </Select>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                placeholder="localhost or db.example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="3306"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="hide-spinners"
                min="1"
                max="65535"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="db_user">Username</Label>
              <Input
                id="db_user"
                placeholder="admin"
                value={db_user}
                onChange={(e) => setUser(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="db_pwd">Password</Label>
              <Input
                id="db_pwd"
                type="password"
                placeholder="password"
                value={db_password}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="database">Database Name</Label>
            <Input
              id="database"
              placeholder="mydatabase"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Connecting...
              </span>
            ) : (
              'Connect'
            )}
          </Button>
          
          {testResult && (
            <div className={`mt-4 p-3 rounded-md ${
              testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {testResult.message}
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}; 