import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './DropdownMenu';
import { Button } from './Button';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  options: SelectOption[];
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      value,
      defaultValue,
      placeholder = 'Select option...',
      options,
      onChange,
      disabled,
      className,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const [selectedValue, setSelectedValue] = React.useState<
      string | number | undefined
    >(value ?? defaultValue);
    const [isOpen, setIsOpen] = React.useState(false);

    const selectedOption = options.find(
      (option) => option.value === selectedValue
    );

    const handleSelect = (optionValue: string | number) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    const sizeClasses = {
      sm: 'h-8 px-2 text-xs',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    };

    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              'justify-between font-normal',
              sizeClasses[size],
              !selectedOption && 'text-muted-foreground',
              className
            )}
            {...props}
          >
            {selectedOption?.label || placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-white w-full min-w-[200px]"
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={option.disabled}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  selectedValue === option.value ? 'opacity-100' : 'opacity-0'
                )}
              />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

Select.displayName = 'Select';

export { Select };
