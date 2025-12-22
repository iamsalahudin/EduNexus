// src/app/error.js
'use client';

export default function Error({ error, reset }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Retry</button>
    </div>
  );
}
