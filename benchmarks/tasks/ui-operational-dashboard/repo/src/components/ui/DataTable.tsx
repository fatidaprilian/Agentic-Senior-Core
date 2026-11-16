import React from 'react';

export interface Column<T> {
  key: keyof T;
  header: string;
  align?: 'left' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, isLoading, emptyMessage = 'No records.' }: DataTableProps<T>) {
  if (isLoading) return <div className="animate-pulse h-32 bg-muted" />;
  if (data.length === 0) return <p className="py-6 text-sm text-muted-foreground">{emptyMessage}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>{columns.map((c) => <th key={String(c.key)} className={c.align === 'right' ? 'py-2 px-4 text-right' : 'py-2 px-4'}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, idx) => (
            <tr key={idx}>{columns.map((c) => <td key={String(c.key)} className={c.align === 'right' ? 'py-2 px-4 text-right font-mono tabular-nums' : 'py-2 px-4'}>{String(row[c.key])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
