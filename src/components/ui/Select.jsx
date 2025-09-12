import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  placeholder, 
  className, 
  children,
  ...props 
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm',
          'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
          'disabled:bg-gray-50 disabled:text-gray-500',
          'bg-white',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;