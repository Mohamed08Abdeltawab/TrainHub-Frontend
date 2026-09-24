import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { cn } from '@/lib/utils';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className={cn('p-0 overflow-hidden', sizeClasses[size])}>
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-foreground">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[min(70vh,36rem)] overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <DialogFooter className="border-t border-border px-5 py-3">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
