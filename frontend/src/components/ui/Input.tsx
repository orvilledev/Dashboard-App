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
            className="block text-sm font-medium text-charcoal-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
            'bg-white text-charcoal-800 placeholder-charcoal-400',
            'focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-charcoal-200 hover:border-charcoal-300',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
