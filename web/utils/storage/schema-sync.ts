/**
 * Schema Synchronization Manager
 * Handles database schema validation and automatic migration
 */

import { supabase } from '../supabase/client';

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
}

interface TableSchema {
  name: string;
  columns: SchemaColumn[];
}

class SchemaSyncManager {
  private expectedSchemas: TableSchema[] = [
    {
      name: 'assets',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'name', type: 'varchar', nullable: false },
        { name: 'creator_wallet', type: 'varchar', nullable: false },
        { name: 'asset_type', type: 'varchar', nullable: false },
        { name: 'file_cid', type: 'varchar', nullable: true },
        { name: 'status', type: 'varchar', nullable: false, default: 'draft' },
        { name: 'is_curated', type: 'boolean', nullable: true, default: false },
        { name: 'curated', type: 'boolean', nullable: true, default: false },
        { name: 'quality_score', type: 'float', nullable: true },
        { name: 'tags', type: 'text[]', nullable: true },
        { name: 'metadata', type: 'jsonb', nullable: true },
        { name: 'created_at', type: 'timestamptz', nullable: false },
        { name: 'updated_at', type: 'timestamptz', nullable: false }
      ]
    }
  ];

  async validateAndSync(): Promise<{ success: boolean; changes: string[]; errors: string[] }> {
    const changes: string[] = [];
    const errors: string[] = [];

    try {
      for (const expectedSchema of this.expectedSchemas) {
        const result = await this.syncTable(expectedSchema);
        changes.push(...result.changes);
        errors.push(...result.errors);
      }

      return { success: errors.length === 0, changes, errors };
    } catch (error) {
      errors.push(`Schema sync failed: ${error}`);
      return { success: false, changes, errors };
    }
  }

  private async syncTable(schema: TableSchema): Promise<{ changes: string[]; errors: string[] }> {
    const changes: string[] = [];
    const errors: string[] = [];

    try {
      // Check if table exists
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', schema.name);

      if (tableError) {
        errors.push(`Failed to check table ${schema.name}: ${tableError.message}`);
        return { changes, errors };
      }

      if (!tables || tables.length === 0) {
        // Table doesn't exist - this is expected for new deployments
        changes.push(`Table ${schema.name} not found - using fallback mode`);
        return { changes, errors };
      }

      // Check columns
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', schema.name);

      if (columnError) {
        errors.push(`Failed to check columns for ${schema.name}: ${columnError.message}`);
        return { changes, errors };
      }

      const existingColumns = new Set(columns?.map(c => c.column_name) || []);
      
      // Find missing columns
      const missingColumns = schema.columns.filter(col => !existingColumns.has(col.name));
      
      if (missingColumns.length > 0) {
        for (const col of missingColumns) {
          try {
            await this.addColumn(schema.name, col);
            changes.push(`Added column ${col.name} to ${schema.name}`);
          } catch (error) {
            // Non-breaking: log but continue
            console.warn(`Could not add column ${col.name} to ${schema.name}:`, error);
            changes.push(`Column ${col.name} missing from ${schema.name} - using fallback`);
          }
        }
      }

    } catch (error) {
      errors.push(`Table sync failed for ${schema.name}: ${error}`);
    }

    return { changes, errors };
  }

  private async addColumn(tableName: string, column: SchemaColumn): Promise<void> {
    const nullable = column.nullable ? '' : 'NOT NULL';
    const defaultValue = column.default !== undefined ? `DEFAULT ${column.default}` : '';
    
    let dataType = column.type;
    if (column.type === 'varchar') dataType = 'VARCHAR(255)';
    if (column.type === 'text[]') dataType = 'TEXT[]';
    if (column.type === 'jsonb') dataType = 'JSONB';
    if (column.type === 'timestamptz') dataType = 'TIMESTAMP WITH TIME ZONE';
    if (column.type === 'float') dataType = 'FLOAT';
    if (column.type === 'boolean') dataType = 'BOOLEAN';

    const sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${column.name} ${dataType} ${nullable} ${defaultValue}`.trim();
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
  }

  async checkSchemaHealth(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      for (const schema of this.expectedSchemas) {
        const { data, error } = await supabase
          .from(schema.name)
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            issues.push(`Table ${schema.name} does not exist`);
          } else if (error.message.includes('column') && error.message.includes('does not exist')) {
            issues.push(`Missing columns in ${schema.name}: ${error.message}`);
          } else {
            issues.push(`Schema issue in ${schema.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      issues.push(`Schema health check failed: ${error}`);
    }

    return { healthy: issues.length === 0, issues };
  }
}

export const schemaSyncManager = new SchemaSyncManager();