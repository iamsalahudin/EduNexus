"use client"

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function Table({ className = '', children, ...props }) {
  return (
    <div className={cx('overflow-auto', className)} {...props}>
      {children}
    </div>
  )
}

export function TableRoot({ className = '', children, ...props }) {
  return (
    <table className={cx('w-full text-sm', className)} {...props}>
      {children}
    </table>
  )
}

export function TableHead({ className = '', children, ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className = '', children, ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className = '', children, ...props }) {
  return (
    <tr className={cx('border-b last:border-b-0', className)} {...props}>
      {children}
    </tr>
  )
}

export function TableHeader({ className = '', children, ...props }) {
  return (
    <th className={cx('py-2 pr-3 text-left font-medium text-gray-600', className)} {...props}>
      {children}
    </th>
  )
}

export function TableCell({ className = '', children, ...props }) {
  return (
    <td className={cx('py-2 pr-3 align-top', className)} {...props}>
      {children}
    </td>
  )
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
