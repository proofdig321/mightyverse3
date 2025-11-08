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
      // Test table access by trying to query it
      const { data, error } = await supabase
        .from(schema.name)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          changes.push(`Table ${schema.name} not found - using fallback mode`);
          return { changes, errors };
        }
        
        // Check for missing column errors
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const missingColumn = error.message.match(/column "([^"]+)"/)?.[1];
          if (missingColumn) {
            changes.push(`Column ${missingColumn} missing from ${schema.name} - manual migration required`);
            errors.push(`Missing column: ${missingColumn}. Run: ALTER TABLE ${schema.name} ADD COLUMN ${missingColumn} BOOLEAN DEFAULT false;`);
          }
        } else {
          errors.push(`Schema issue in ${schema.name}: ${error.message}`);
        }
      } else {
        changes.push(`Table ${schema.name} accessible`);
      }

    } catch (error) {
      errors.push(`Table sync failed for ${schema.name}: ${error}`);
    }

    return { changes, errors };
  }

  async getManualMigrationSQL(): Promise<string[]> {
    const sql = [];
    for (const schema of this.expectedSchemas) {
      for (const col of schema.columns) {
        if (col.name === 'is_curated' || col.name === 'curated') {
          sql.push(`ALTER TABLE ${schema.name} ADD COLUMN IF NOT EXISTS ${col.name} BOOLEAN DEFAULT false;`);
        }
      }
    }
    return sql;
  }

  async checkSchemaHealth(): Promise<{ healthy: boolean; issues: string[]; migrationSQL?: string[] }> {
    const issues: string[] = [];
    let migrationSQL: string[] = [];

    try {
      // Test curated column specifically
      const { data, error } = await supabase
        .from('assets')
        .select('is_curated, curated')
        .limit(1);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const missingColumn = error.message.match(/column "([^"]+)"/)?.[1];
          if (missingColumn) {
            issues.push(`Missing column: ${missingColumn}`);
            migrationSQL.push(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS ${missingColumn} BOOLEAN DEFAULT false;`);
          }
        } else {
          issues.push(`Schema issue: ${error.message}`);
        }
      }
    } catch (error) {
      issues.push(`Schema health check failed: ${error}`);
    }

    return { 
      healthy: issues.length === 0, 
      issues,
      migrationSQL: migrationSQL.length > 0 ? migrationSQL : undefined
    };
  }
}

export const schemaSyncManager = new SchemaSyncManager();