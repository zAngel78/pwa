import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ 
  label, 
  error, 
  className, 
  type = 'text',
  as = 'input',
  ...props 
}, ref) => {
  const Component = as;
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Component
        ref={ref}
        type={as === 'input' ? type : undefined}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm',
          'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
          'disabled:bg-gray-50 disabled:text-gray-500',
          'placeholder:text-gray-400',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;