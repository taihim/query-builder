export type DataSourceType = 'mysql' | 'postgres' | 'sqlite';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  host: string;
  port?: number | string;
  database: string;
  username: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
  lastConnected?: Date;
  tables?: DatabaseTable[];
}

export interface TableColumn {
  name: string;
  dataType: string;
  friendlyType: string; // User-friendly type name
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface DatabaseTable {
  name: string;
  schema?: string;
  columns: TableColumn[];
  rowCount?: number;
} 