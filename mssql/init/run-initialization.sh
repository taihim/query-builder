#!/bin/bash
# Wait for MSSQL server to be ready
sleep 30s

# Run the SQL initialization script with the -C flag
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $SA_PASSWORD -C -i /docker-entrypoint-initdb.d/01-init.sql

echo "MSSQL initialization completed" 