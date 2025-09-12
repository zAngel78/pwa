import { cn } from '../../lib/utils';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  className, 
  headerActions,
  padding = true,
  ...props 
}) => {
  return (
    <div 
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerActions) && (
        <div className={cn(
          'px-6 py-4 border-b border-gray-200',
          !title && !subtitle && 'py-3'
        )}>
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={cn(padding && 'p-6')}>
        {children}
      </div>
    </div>
  );
};

export default Card;