import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: 'var(--color-text-primary)',
            color: 'var(--color-surface)',
          };
        case 'secondary':
          return {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-primary)',
          };
        case 'outline':
          return {
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
          };
        case 'ghost':
          return {
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
          };
      }
    };
    
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'hover:opacity-90': variant === 'primary' || variant === 'secondary',
            'border-2 hover:opacity-70': variant === 'outline',
            'hover:opacity-70': variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        style={getVariantStyles()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
