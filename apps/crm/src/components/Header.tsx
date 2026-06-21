"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getInitials, roleLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  /** Called when the hamburger menu is clicked (mobile sidebar toggle) */
  onMenuClick: () => void;
  /** Optional page title shown on mobile / fallback */
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = getInitials(user?.displayName);
  const role = user?.role ?? "agent";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      {/* ── Left section ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {title && (
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        )}
      </div>

      {/* ── Right section ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight">
                  {user?.displayName ?? "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user?.email ?? ""}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="hidden text-[10px] px-1.5 py-0 sm:inline-flex"
              >
                {roleLabel(role)}
              </Badge>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                  {roleLabel(role)}
                </Badge>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled>
              <UserIcon className="h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
