import React from 'react';
import clsx from 'clsx';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-x-auto rounded-lg border border-slate-800">
    <table className={clsx('w-full text-left text-sm text-slate-300', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={clsx('bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={clsx('divide-y divide-slate-800/60 bg-slate-950/40', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={clsx('transition-colors hover:bg-slate-800/40', className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={clsx('px-4 py-3 font-medium', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={clsx('px-4 py-3 align-middle', className)} {...props} />
);

export default Table;
