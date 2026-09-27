import { useNavigate } from 'react-router-dom';
import { demoUsers, type DemoUser } from '../../config/demoUsers';
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
  Badge,
  Button,
  Modal,
} from '@/components/ui';
import {
  Check,
  ChevronDown,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  ArrowRightLeft,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../auth/AuthContext';
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

type Props = {
  role: DashboardRole;
  onSelectRole: (role: DashboardRole) => void;
  onNavigate: (label: string) => void;
  roleMenuOpen?: boolean;
  profileMenuOpen?: boolean;
  onToggleRoleMenu?: (open: boolean) => void;
  onToggleProfileMenu?: (open: boolean) => void;
};

export default function UserNav({
  role,
  roleMenuOpen,
  profileMenuOpen,
  onToggleRoleMenu,
  onToggleProfileMenu,
  onSelectRole,
  onNavigate,
}: Props) {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { user: authUser, signOut } = useAuth();
  const { t } = useLanguage();
  const activeUser = authUser
    ? { ...(demoUsers[authUser.role] ?? demoUsers.ORG_ADMIN), name: authUser.name, email: authUser.email, role: authUser.role }
    : demoUsers[role] ?? demoUsers.ORG_ADMIN;
  const userList = Object.values(demoUsers);
  const canSwitchDemo = !authUser || authUser.demo === true;

  const handleSelectUser = (user: DemoUser) => {
    onSelectRole(user.role);
    navigate(`${user.path}?view=overview`);
  };

  const isRoleControlled = roleMenuOpen !== undefined && typeof onToggleRoleMenu === 'function';
  const isProfileControlled = profileMenuOpen !== undefined && typeof onToggleProfileMenu === 'function';

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {/* 1. Role & Demo User Switcher Button */}
      {canSwitchDemo ? <DropdownMenu
        {...(isRoleControlled
          ? {
              open: roleMenuOpen,
              onOpenChange: onToggleRoleMenu,
            }
          : {})}
      >
        <DropdownMenuTrigger
          className="group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card/70 px-2.5 text-xs text-foreground shadow-sm transition hover:border-border/80 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Shield className="size-3.5 text-primary" aria-hidden="true" />
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">{t('Role:')}</span>
          <span className="font-semibold text-primary">{t(activeUser.roleTitle)}</span>
          <ChevronDown
            className={cn(
              'size-3 text-muted-foreground transition-transform duration-200 group-data-open:rotate-180 group-data-open:text-foreground group-aria-expanded:rotate-180',
              roleMenuOpen && 'rotate-180 text-foreground'
            )}
            aria-hidden="true"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-1.5 shadow-2xl">
          <div className="px-2.5 py-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ArrowRightLeft className="size-3.5 text-primary" />
              {t('Switch Demo User / Role')}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t('Select any persona to view their permissions and dashboard')}
            </p>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            {userList.map((user) => {
              const isSelected = role === user.role;

              return (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                    isSelected && 'bg-primary/10 font-medium'
                  )}
                >
                  <Avatar className={cn('mt-0.5 size-7 text-[10px] font-bold text-white', user.avatarColor)}>
                    <AvatarFallback className={cn('text-white', user.avatarColor)}>
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground">{user.name}</p>
                      {isSelected && (
                        <Badge variant="default" className="px-1 py-0 text-[8px] uppercase">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-primary">{t(user.roleTitle)}</p>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                      {user.description}
                    </p>
                  </div>

                  {isSelected && <Check className="mt-1 size-4 shrink-0 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <div className="px-2.5 py-1.5 text-[10px] text-muted-foreground/80">
              {t('Demo environment: Instant role switching enabled')}
          </div>
        </DropdownMenuContent>
      </DropdownMenu> : <Badge variant="outline" className="px-2.5 py-2 text-xs">{t(activeUser.roleTitle)}</Badge>}

      {/* 2. User Profile Menu */}
      <DropdownMenu
        {...(isProfileControlled
          ? {
              open: profileMenuOpen,
              onOpenChange: onToggleProfileMenu,
            }
          : {})}
      >
        <DropdownMenuTrigger
          aria-label="Open user profile menu"
          className="cursor-pointer rounded-full ring-2 ring-primary/20 transition hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className={cn('size-9 border border-border text-xs font-bold text-white shadow-sm', activeUser.avatarColor)}>
            <AvatarFallback className={cn('text-white', activeUser.avatarColor)}>
              {activeUser.initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-68 p-1.5 shadow-2xl">
          {/* Active User Header */}
          <div className="flex items-center gap-3 p-2.5">
            <Avatar className={cn('size-10 text-xs font-bold text-white shadow-sm', activeUser.avatarColor)}>
              <AvatarFallback className={cn('text-white', activeUser.avatarColor)}>
                {activeUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{activeUser.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{activeUser.email}</p>
              <Badge variant="default" className="mt-1 px-1.5 py-0 text-[9px] uppercase tracking-wider">
                {t(activeUser.roleTitle)}
              </Badge>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onNavigate('User profile')}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <UserRound className="size-3.5" />
            <span>{t('User profile')}</span>
          </DropdownMenuItem>

          {/* Quick Switch Demo User */}
          {canSwitchDemo && <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('Switch Demo Account')}
            </DropdownMenuLabel>

            {userList.map((user) => {
              const isSelected = role === user.role;
              return (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs',
                    isSelected && 'bg-primary/10 font-medium text-primary'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('grid size-5 place-items-center rounded-full text-[9px] font-bold text-white', user.avatarColor)}>
                      {user.initials}
                    </span>
                    <span className="truncate text-foreground">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground">({t(user.roleTitle)})</span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>}

          <DropdownMenuSeparator />

          {/* Settings & Help */}
          <DropdownMenuGroup>
            {role === 'ORG_ADMIN' && <DropdownMenuItem
              onClick={() => onNavigate('Organization settings')}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings className="size-3.5 text-muted-foreground" />
              <span>{t('Organization settings')}</span>
            </DropdownMenuItem>}

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="size-3.5 text-muted-foreground" />
              <span>{t('Documentation & Support')}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Sign Out Action */}
          <DropdownMenuItem
            onClick={() => setLogoutOpen(true)}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="size-3.5" />
            <span>{t('Sign out')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title={t('Sign out?')}
        description={t('You will need to sign in again to access your workspace.')}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>{t('Cancel')}</Button>
            <Button variant="destructive" onClick={() => { signOut(); setLogoutOpen(false); navigate('/', { replace: true }); }}>{t('Sign out')}</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t('Are you sure you want to end this session?')}</p>
      </Modal>
    </div>
  );
}
