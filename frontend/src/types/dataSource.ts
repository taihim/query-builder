export type DataSourceType = 'postgres' | 'mysql' | 'mongodb' | 'sqlite' | 'oracle';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  host?: string;
  lastConnected?: Date;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
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