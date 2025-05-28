import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';
import { ExportFormat, useDataExport } from '../../lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './DropdownMenu';

export interface Column<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    onChange?: (page: number, pageSize: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  };
  rowKey?: string | ((record: T) => string);
  emptyText?: string;
  rowSelection?: {
    selectedRowKeys?: (string | number)[];
    onChange?: (
      selectedRowKeys: (string | number)[],
      selectedRows: T[]
    ) => void;
    onSelect?: (record: T, selected: boolean, selectedRows: T[]) => void;
    onSelectAll?: (
      selected: boolean,
      selectedRows: T[],
      changeRows: T[]
    ) => void;
  };
  onRow?: (
    record: T,
    index: number
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  exportConfig?: {
    enabled?: boolean;
    filename?: string;
    formats?: ExportFormat[];
    title?: string;
  };
}

export function DataTable<T = any>({
  columns,
  data,
  loading = false,
  pagination,
  sorting,
  rowKey = 'id',
  emptyText = 'No data available',
  rowSelection,
  onRow,
  exportConfig,
}: DataTableProps<T>) {
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>(
    rowSelection?.selectedRowKeys || []
  );
  const { exportData } = useDataExport();

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record as any)[rowKey] || index.toString();
  };

  const handleSort = (key: string) => {
    if (!sorting?.onSort) return;

    let newOrder: 'asc' | 'desc' = 'asc';
    if (sorting.sortBy === key && sorting.sortOrder === 'asc') {
      newOrder = 'desc';
    }

    sorting.onSort(key, newOrder);
  };

  const getSortIcon = (key: string) => {
    if (sorting?.sortBy !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sorting.sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedKeys = checked
      ? data.map((record, index) => getRowKey(record, index))
      : [];
    setSelectedKeys(newSelectedKeys);
    rowSelection?.onChange?.(newSelectedKeys, checked ? data : []);
    rowSelection?.onSelectAll?.(checked, checked ? data : [], data);
  };

  const handleSelectRow = (record: T, index: number, checked: boolean) => {
    const key = getRowKey(record, index);
    const newSelectedKeys = checked
      ? [...selectedKeys, key]
      : selectedKeys.filter((k) => k !== key);

    setSelectedKeys(newSelectedKeys);
    const selectedRows = data.filter((item, idx) =>
      newSelectedKeys.includes(getRowKey(item, idx))
    );

    rowSelection?.onChange?.(newSelectedKeys, selectedRows);
    rowSelection?.onSelect?.(record, checked, selectedRows);
  };

  const handleExport = async (format: ExportFormat) => {
    const exportColumns = columns.map((col) => ({
      key: col.key,
      label: col.title,
      format: col.render ? undefined : undefined, // Use default formatting for now
      visible: true,
    }));

    const result = await exportData(data, exportColumns, format, {
      filename: exportConfig?.filename,
    });

    if (!result.success) {
      console.error('Export failed:', result.error);
      // You could show a toast notification here
    }
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {(current - 1) * pageSize + 1} to{' '}
          {Math.min(current * pageSize, total)} of {total} entries
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange?.(1, pageSize)}
              disabled={current === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange?.(current - 1, pageSize)}
              disabled={current === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm">Page</span>
              <Input
                className="w-16 h-8 text-center"
                value={current}
                onChange={(e) => {
                  const page = parseInt(e.target.value) || 1;
                  if (page >= 1 && page <= totalPages) {
                    onChange?.(page, pageSize);
                  }
                }}
              />
              <span className="text-sm">of {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange?.(current + 1, pageSize)}
              disabled={current === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange?.(totalPages, pageSize)}
              disabled={current === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exportConfig?.enabled && (
        <div className="flex justify-between items-center">
          <div>
            {exportConfig.title && (
              <h3 className="text-lg font-medium">{exportConfig.title}</h3>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(
                exportConfig.formats || [ExportFormat.CSV, ExportFormat.JSON]
              ).map((format) => (
                <DropdownMenuItem
                  key={format}
                  onClick={() => handleExport(format)}
                  className="cursor-pointer"
                >
                  Export as {format.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {rowSelection && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={
                      selectedKeys.length === data.length && data.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={
                    column.align === 'center'
                      ? 'text-center'
                      : column.align === 'right'
                      ? 'text-right'
                      : ''
                  }
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {column.title}
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.title
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              data.map((record, index) => {
                const key = getRowKey(record, index);
                const isSelected = selectedKeys.includes(key);
                const rowProps = onRow?.(record, index) || {};

                return (
                  <TableRow
                    key={key}
                    data-state={isSelected ? 'selected' : undefined}
                    {...rowProps}
                  >
                    {rowSelection && (
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={isSelected}
                          onChange={(e) =>
                            handleSelectRow(record, index, e.target.checked)
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = (record as any)[column.key];
                      const content = column.render
                        ? column.render(value, record, index)
                        : value?.toString() || '';

                      return (
                        <TableCell
                          key={column.key}
                          className={
                            column.align === 'center'
                              ? 'text-center'
                              : column.align === 'right'
                              ? 'text-right'
                              : ''
                          }
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}
    </div>
  );
}
