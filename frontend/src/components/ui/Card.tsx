import { type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-xl p-6',
          {
            'shadow-soft': variant === 'default',
            'shadow-medium hover:shadow-elevated transition-shadow duration-300':
              variant === 'elevated',
            'shadow-none': variant === 'bordered',
          },
          className
        )}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          borderWidth: variant === 'bordered' ? '1px' : '0',
          ...style, // Merge with provided style to allow overrides
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('mb-4 pb-4 border-b', className)}
        style={{ borderColor: 'var(--color-border-light)' }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={clsx('text-xl font-semibold font-serif', className)}
        style={{ color: 'var(--color-text-primary)' }}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={clsx(className)} 
        style={{ color: 'var(--color-text-secondary)' }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';
