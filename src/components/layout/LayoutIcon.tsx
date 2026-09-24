import type { FC } from 'react';
import type { NavItem } from '../../types/nav';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Calendar,
  BarChart3,
  Building2,
  ClipboardList,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<NavItem['icon'], FC<LucideProps>> = {
  overview: LayoutDashboard,
  courses: BookOpen,
  learners: Users,
  settings: Settings,
  calendar: Calendar,
  reports: BarChart3,
  organization: Building2,
  assignments: ClipboardList,
};

export default function LayoutIcon({
  icon,
  className = 'h-4 w-4',
}: {
  icon: NavItem['icon'];
  className?: string;
}) {
  const IconComponent = iconMap[icon] ?? LayoutDashboard;
  return <IconComponent className={cn('h-4 w-4 shrink-0', className)} aria-hidden="true" />;
}
