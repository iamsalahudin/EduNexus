<<<<<<< HEAD
"use client"

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function Table({ className = '', children }) {
  return <div className={cx('overflow-auto', className)}>{children}</div>
}

export function TableRoot({ className = '', children }) {
  return <table className={cx('w-full text-sm', className)}>{children}</table>
}

export function TableHead({ className = '', children }) {
  return <thead className={className}>{children}</thead>
}

export function TableBody({ className = '', children }) {
  return <tbody className={className}>{children}</tbody>
}

export function TableRow({ className = '', children }) {
  return <tr className={cx('border-b last:border-b-0', className)}>{children}</tr>
}

export function TableHeader({ className = '', children }) {
  return <th className={cx('py-2 pr-3 text-left font-medium text-gray-600', className)}>{children}</th>
}

export function TableCell({ className = '', children }) {
  return <td className={cx('py-2 pr-3 align-top', className)}>{children}</td>
}

const TableComponents = {
  Table,
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
}

export default TableComponents
=======
"use client"

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function Table({ className = '', children }) {
  return <div className={cx('overflow-auto', className)}>{children}</div>
}

export function TableRoot({ className = '', children }) {
  return <table className={cx('w-full text-sm', className)}>{children}</table>
}

export function TableHead({ className = '', children }) {
  return <thead className={className}>{children}</thead>
}

export function TableBody({ className = '', children }) {
  return <tbody className={className}>{children}</tbody>
}

export function TableRow({ className = '', children }) {
  return <tr className={cx('border-b last:border-b-0', className)}>{children}</tr>
}

export function TableHeader({ className = '', children }) {
  return <th className={cx('py-2 pr-3 text-left font-medium text-gray-600', className)}>{children}</th>
}

export function TableCell({ className = '', children }) {
  return <td className={cx('py-2 pr-3 align-top', className)}>{children}</td>
}

const TableComponents = {
  Table,
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
}

export default TableComponents
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
