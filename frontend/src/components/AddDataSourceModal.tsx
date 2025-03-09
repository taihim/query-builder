import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DataSourceType } from '@/types/dataSource';

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
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset test result and form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // If modal closes, reset the test result and form data
      setTestResult(null);
      resetForm();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
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
    
    // Trim all input values before submission
    const trimmedName = name.trim();
    const trimmedHost = host.trim();
    const trimmedPort = port.trim();
    const trimmedDatabase = database.trim();
    const trimmedUser = db_user.trim();
    const trimmedPassword = db_password.trim();
    
    onAddDataSource(
      trimmedName,
      dataSourceType,
      trimmedHost,
      trimmedPort,
      trimmedDatabase,
      trimmedUser,
      trimmedPassword
    );
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      resetForm();
      onOpenChange(false);
    }, 500);
  };

  const resetForm = () => {
    setName('');
    setDataSourceType('mysql');
    setHost('');
    setPort('');
    setUser('');
    setPwd('');
    setDatabase('');
  };

  const testConnection = async () => {
    // Trim all input values before testing
    const trimmedHost = host.trim();
    const trimmedPort = port.trim();
    const trimmedUser = db_user.trim();
    const trimmedPassword = db_password.trim();
    const trimmedDatabase = database.trim();
    
    if (!trimmedHost || !trimmedPort || !dataSourceType || !trimmedUser || !trimmedPassword || !trimmedDatabase) {
      setTestResult({
        success: false,
        message: 'Please fill in all connection fields first'
      });
      return;
    }
    
    try {
      setIsTestingConnection(true);
      setTestResult(null);
      
      const API_URL = import.meta.env.VITE_API_URL;
      console.log(API_URL);
      const response = await fetch(`${API_URL}/api/datasources/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: dataSourceType,
          host: trimmedHost,
          port: trimmedPort,
          username: trimmedUser,
          password: trimmedPassword,
          database_name: trimmedDatabase
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Request failed: ${(error as Error).message}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

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
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
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
                placeholder="5432"
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
          
          <div className="flex gap-4 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isTestingConnection || isSubmitting}
              className="flex-1"
            >
              {isTestingConnection ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Testing...
                </span>
              ) : (
                'Test Connection'
              )}
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || isTestingConnection}
              className="flex-1"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Connecting...
                </span>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
          
          {testResult && (
            <div className={`mt-4 p-3 rounded-md ${
              testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {testResult.message}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}; 