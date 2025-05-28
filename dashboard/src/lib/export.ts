import { format } from 'date-fns';

// Export formats
export const ExportFormat = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
  PDF: 'pdf',
} as const;

export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

// Export options
interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  delimiter?: string;
}

// Column configuration for exports
interface ColumnConfig {
  key: string;
  label: string;
  format?: (value: any) => string;
  visible?: boolean;
}

// Base export service
export class ExportService {
  // Convert data to CSV format
  static toCSV(
    data: any[],
    columns: ColumnConfig[],
    options: ExportOptions = {}
  ): string {
    const { includeHeaders = true, delimiter = ',' } = options;
    const visibleColumns = columns.filter((col) => col.visible !== false);

    let csv = '';

    // Add headers
    if (includeHeaders) {
      csv +=
        visibleColumns.map((col) => `"${col.label}"`).join(delimiter) + '\n';
    }

    // Add data rows
    data.forEach((row) => {
      const values = visibleColumns.map((col) => {
        let value = row[col.key];

        // Apply formatting if provided
        if (col.format && value !== null && value !== undefined) {
          value = col.format(value);
        }

        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }

        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });

      csv += values.join(delimiter) + '\n';
    });

    return csv;
  }

  // Convert data to JSON format
  static toJSON(
    data: any[],
    columns: ColumnConfig[],
    _options: ExportOptions = {}
  ): string {
    const visibleColumns = columns.filter((col) => col.visible !== false);

    const formattedData = data.map((row) => {
      const formattedRow: any = {};

      visibleColumns.forEach((col) => {
        let value = row[col.key];

        // Apply formatting if provided
        if (col.format && value !== null && value !== undefined) {
          value = col.format(value);
        }

        formattedRow[col.key] = value;
      });

      return formattedRow;
    });

    return JSON.stringify(formattedData, null, 2);
  }

  // Download file
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate filename with timestamp
  static generateFilename(
    baseName: string,
    exportFormat: ExportFormat
  ): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    return `${baseName}_${timestamp}.${exportFormat}`;
  }

  // Main export function
  static async exportData(
    data: any[],
    columns: ColumnConfig[],
    format: ExportFormat,
    options: ExportOptions = {}
  ) {
    const filename =
      options.filename || this.generateFilename('export', format);

    try {
      switch (format) {
        case ExportFormat.CSV: {
          const csv = this.toCSV(data, columns, options);
          this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
          break;
        }

        case ExportFormat.JSON: {
          const json = this.toJSON(data, columns, options);
          this.downloadFile(json, filename, 'application/json');
          break;
        }

        case ExportFormat.XLSX: {
          // For XLSX, you would typically use a library like SheetJS
          // This is a placeholder implementation
          const csv = this.toCSV(data, columns, options);
          this.downloadFile(
            csv,
            filename.replace('.xlsx', '.csv'),
            'text/csv;charset=utf-8;'
          );
          console.warn('XLSX export not implemented, falling back to CSV');
          break;
        }

        case ExportFormat.PDF: {
          // For PDF, you would typically use a library like jsPDF
          // This is a placeholder implementation
          const content = this.toJSON(data, columns, options);
          this.downloadFile(
            content,
            filename.replace('.pdf', '.json'),
            'application/json'
          );
          console.warn('PDF export not implemented, falling back to JSON');
          break;
        }

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return { success: true, filename };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// React hook for data export
export function useDataExport() {
  const exportData = async (
    data: any[],
    columns: ColumnConfig[],
    format: ExportFormat,
    options: ExportOptions = {}
  ) => {
    return await ExportService.exportData(data, columns, format, options);
  };

  // Export users data
  const exportUsers = async (
    users: any[],
    exportFormat: ExportFormat = ExportFormat.CSV
  ) => {
    const columns: ColumnConfig[] = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      {
        key: 'createdAt',
        label: 'Created At',
        format: (value) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'),
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        format: (value) =>
          value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : 'Never',
      },
    ];

    return await exportData(users, columns, exportFormat, {
      filename: ExportService.generateFilename('users', exportFormat),
    });
  };

  // Export tenants data
  const exportTenants = async (
    tenants: any[],
    exportFormat: ExportFormat = ExportFormat.CSV
  ) => {
    const columns: ColumnConfig[] = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'slug', label: 'Slug' },
      { key: 'status', label: 'Status' },
      { key: 'plan', label: 'Plan' },
      { key: 'users', label: 'User Count', format: (value) => String(value) },
      {
        key: 'createdAt',
        label: 'Created At',
        format: (value) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'),
      },
    ];

    return await exportData(tenants, columns, exportFormat, {
      filename: ExportService.generateFilename('tenants', exportFormat),
    });
  };

  // Export inventory data
  const exportInventory = async (
    inventory: any[],
    exportFormat: ExportFormat = ExportFormat.CSV
  ) => {
    const columns: ColumnConfig[] = [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Product Name' },
      { key: 'category', label: 'Category' },
      {
        key: 'currentStock',
        label: 'Current Stock',
        format: (value) => String(value),
      },
      {
        key: 'minStock',
        label: 'Minimum Stock',
        format: (value) => String(value),
      },
      { key: 'location', label: 'Location' },
      {
        key: 'value',
        label: 'Value',
        format: (value) => `$${value.toFixed(2)}`,
      },
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        format: (value) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'),
      },
    ];

    return await exportData(inventory, columns, exportFormat, {
      filename: ExportService.generateFilename('inventory', exportFormat),
    });
  };

  // Export audit logs
  const exportAuditLogs = async (
    logs: any[],
    exportFormat: ExportFormat = ExportFormat.CSV
  ) => {
    const columns: ColumnConfig[] = [
      { key: 'id', label: 'ID' },
      { key: 'action', label: 'Action' },
      { key: 'user', label: 'User' },
      { key: 'resource', label: 'Resource' },
      { key: 'details', label: 'Details' },
      {
        key: 'timestamp',
        label: 'Timestamp',
        format: (value) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'),
      },
      { key: 'ipAddress', label: 'IP Address' },
    ];

    return await exportData(logs, columns, exportFormat, {
      filename: ExportService.generateFilename('audit_logs', exportFormat),
    });
  };

  return {
    exportData,
    exportUsers,
    exportTenants,
    exportInventory,
    exportAuditLogs,
  };
}

// Utility for bulk operations
export function useBulkOperations() {
  // Bulk export multiple datasets
  const bulkExport = async (
    datasets: Array<{
      name: string;
      data: any[];
      columns: ColumnConfig[];
      format?: ExportFormat;
    }>
  ) => {
    const results = [];

    for (const dataset of datasets) {
      const result = await ExportService.exportData(
        dataset.data,
        dataset.columns,
        dataset.format || ExportFormat.CSV,
        {
          filename: ExportService.generateFilename(
            dataset.name,
            dataset.format || ExportFormat.CSV
          ),
        }
      );

      results.push({
        name: dataset.name,
        ...result,
      });
    }

    return results;
  };

  return {
    bulkExport,
  };
}

// Simple export functions for backward compatibility and testing
interface SimpleColumnConfig {
  key: string;
  header: string;
}

// Simple CSV export function
export function exportToCSV(
  data: any[],
  filename: string,
  columns?: SimpleColumnConfig[]
): void {
  let csvContent = '';

  if (data.length === 0) {
    csvContent = '';
  } else {
    const keys = columns ? columns.map((col) => col.key) : Object.keys(data[0]);
    const headers = columns ? columns.map((col) => col.header) : keys;

    // Add headers
    csvContent += headers.map((header) => `"${header}"`).join(',') + '\n';

    // Add data rows
    data.forEach((row) => {
      const values = keys.map((key) => {
        const value = row[key];
        if (value === null || value === undefined) {
          return '""';
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += values.join(',') + '\n';
    });
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Simple JSON export function
export function exportToJSON(data: any[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);

  // Create and download file
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
