'use client';

export default function Button({ children, className = '', ...rest }) {
  return (
    <button
      className={`w-full inline-flex justify-center items-center rounded-lg py-2 px-4 font-medium shadow-sm transition disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
