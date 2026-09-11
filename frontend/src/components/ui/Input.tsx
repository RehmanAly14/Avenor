import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("block text-xs font-medium text-text-secondary mb-1.5", className)} {...props} />
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, icon, error, ...props }, ref) => (
  <div>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{icon}</span>}
      <input
        ref={ref}
        className={cn(
          "w-full h-9 rounded-md border bg-surface-elevated px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors",
          "border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
          icon && "pl-9",
          error && "border-danger focus:border-danger focus:ring-danger",
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
));
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => (
  <div>
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors resize-none",
        "border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
        error && "border-danger focus:border-danger focus:ring-danger",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
));
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => (
  <div>
    <select
      ref={ref}
      className={cn(
        "w-full h-9 rounded-md border bg-surface-elevated px-3 text-sm text-text-primary transition-colors appearance-none",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239aa5b4%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] bg-no-repeat bg-[right_0.5rem_center]",
        "border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent pr-9",
        error && "border-danger",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
));
Select.displayName = "Select";
