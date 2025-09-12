import { cn } from '../../lib/utils';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-emerald-100 text-emerald-800',
    secondary: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
    // Estados específicos
    pendiente: 'bg-yellow-100 text-yellow-800',
    compra: 'bg-blue-100 text-blue-800',
    facturado: 'bg-emerald-100 text-emerald-800',
    nulo: 'bg-gray-100 text-gray-800',
    entregado: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
  };
  
  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;