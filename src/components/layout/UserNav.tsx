import { roleLabels } from '../../config/navigation';
import type { DashboardRole } from '../../types/nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
} from '@/components/ui';
import { Check, ChevronDown, Shield } from 'lucide-react';

const roles: DashboardRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'INSTRUCTOR', 'STUDENT'];

type Props = {
  role: DashboardRole;
  roleMenuOpen: boolean;
  profileMenuOpen: boolean;
  onToggleRoleMenu: () => void;
  onToggleProfileMenu: () => void;
  onSelectRole: (role: DashboardRole) => void;
};

export default function UserNav({
  role,
  roleMenuOpen,
  profileMenuOpen,
  onToggleRoleMenu,
  onToggleProfileMenu,
  onSelectRole,
}: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {/* Role Switcher */}
      <DropdownMenu open={roleMenuOpen} onOpenChange={() => onToggleRoleMenu()}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card/80 px-2.5 text-xs text-foreground shadow-sm transition hover:border-border/80 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Shield className="size-3.5 text-primary" aria-hidden="true" />
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">Role:</span>
              <span className="font-semibold text-primary">{role}</span>
              <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
            </button>
          }
        />
        <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-1.5 shadow-2xl">
          <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] text-muted-foreground">
            Switch role context (demo)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {roles.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => onSelectRole(option)}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs"
              >
                <span>{roleLabels[option]}</span>
                {role === option && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Profile */}
      <DropdownMenu open={profileMenuOpen} onOpenChange={() => onToggleProfileMenu()}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Open user profile"
              className="rounded-full ring-2 ring-primary/20 transition hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-9 border border-border bg-primary text-xs font-semibold text-primary-foreground">
                <AvatarFallback className="bg-primary text-primary-foreground">AM</AvatarFallback>
              </Avatar>
            </button>
          }
        />
        <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-3 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <Avatar className="size-10 bg-primary font-semibold text-primary-foreground">
              <AvatarFallback className="bg-primary text-primary-foreground">AM</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">Alex Morgan</p>
              <p className="truncate text-[11px] text-muted-foreground">alex.morgan@example.com</p>
            </div>
          </div>
          <div className="pt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current role</p>
            <p className="mt-1 text-xs font-medium text-primary">{roleLabels[role]}</p>
            <p className="mt-2 text-[10px] leading-4 text-muted-foreground/80">
              Profile details are demo content until authentication is connected.
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
