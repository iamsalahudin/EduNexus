// src/components/feedback/Skeleton.js
export default function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}
