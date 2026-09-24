import type { HTMLAttributes, ReactNode } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import { cn } from '@/lib/utils';

type Props = HTMLAttributes<HTMLElement> & {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function FormSection({
  title,
  description,
  children,
  footer,
  className = '',
  ...props
}: Props) {
  return (
    <Card className={cn('p-0 overflow-hidden', className)} {...(props as any)}>
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">{children}</CardContent>
      {footer && (
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
