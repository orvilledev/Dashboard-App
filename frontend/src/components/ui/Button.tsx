import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-charcoal-800 text-cream-50 hover:bg-charcoal-700 focus:ring-charcoal-500':
              variant === 'primary',
            'bg-gold-400 text-charcoal-900 hover:bg-gold-500 focus:ring-gold-400':
              variant === 'secondary',
            'border-2 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 focus:ring-charcoal-300':
              variant === 'outline',
            'text-charcoal-600 hover:bg-charcoal-100 focus:ring-charcoal-200':
              variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
