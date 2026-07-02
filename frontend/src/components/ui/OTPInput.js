'use client';
import { useRef, useEffect } from 'react';

export default function OTPInput({ length = 4, value = '', onChange }) {
  const inputs = useRef([]);

  useEffect(() => {
    // focus first empty box
    const idx = value.length < length ? value.length : length - 1;
    inputs.current[idx]?.focus?.();
  }, [value, length]);

  const handleChange = (e, i) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 1);
    const arr = value.split('').slice(0, length);
    arr[i] = v;
    const next = arr.join('');
    onChange(next);
    if (v && inputs.current[i + 1]) inputs.current[i + 1].focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !value[i] && inputs.current[i - 1]) {
      inputs.current[i - 1].focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          inputMode="numeric"
          pattern="\d*"
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-12 h-12 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
