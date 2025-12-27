import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            error
              ? 'focus:ring-red-400'
              : '',
            className
          )}
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            borderColor: error ? '#f87171' : 'var(--color-border)',
          }}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
