import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  LayoutGrid,
  UserCircle,
  Code,
  CheckSquare,
  Bell,
  Box,
  Zap,
  Home,
  UserPlus,
  UserMinus,
  Network,
  Gift,
  Star,
  Clock,
  Heart,
  DollarSign,
  CreditCard,
  Award,
  Monitor,
  Users,
  Puzzle,
  Database,
  Wrench,
  Settings,
  Globe,
  Store,
  HelpCircle,
} from 'lucide-react';

/** Flyout list (screenshot 2) — no favorite stars in UI. */
export const TOOLS_FLYOUT_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'activity-log', label: 'Activity Log', icon: Activity },
  { id: 'app-studio', label: 'App Studio', icon: LayoutGrid },
  { id: 'approvals', label: 'Approvals', icon: UserCircle },
  { id: 'developer', label: 'Developer', icon: Code },
  { id: 'inbox', label: 'Inbox', icon: CheckSquare },
  { id: 'notification-center', label: 'Notification Center', icon: Bell },
  { id: 'recipes', label: 'Recipes', icon: Box },
  { id: 'workflow-studio', label: 'Workflow Studio', icon: Zap },
];

export type PlatformNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** When true, hovering opens the Tools flyout (screenshot 4). */
  opensToolsFlyout?: boolean;
  chevron?: boolean;
};

export const MEGA_MENU_TOP: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'hire', label: 'Hire', icon: UserPlus },
  { id: 'offboard', label: 'Offboard', icon: UserMinus },
  { id: 'org-chart', label: 'Org Chart', icon: Network },
];

export const MEGA_MENU_PRODUCTS: PlatformNavItem[] = [
  { id: 'favorites', label: 'Favorites', icon: Star, chevron: true },
  { id: 'time', label: 'Time', icon: Clock, chevron: true },
  { id: 'benefits', label: 'Benefits', icon: Heart, chevron: true },
  { id: 'payroll', label: 'Payroll', icon: DollarSign, chevron: true },
  { id: 'finance', label: 'Finance', icon: CreditCard, chevron: true },
  { id: 'talent', label: 'Talent', icon: Award, chevron: true },
  { id: 'it', label: 'IT', icon: Monitor, chevron: true },
  { id: 'hr', label: 'HR', icon: Users, chevron: true },
  { id: 'custom-apps', label: 'Custom Apps', icon: Puzzle, chevron: true },
];

export const MEGA_MENU_PLATFORM: PlatformNavItem[] = [
  { id: 'data', label: 'Data', icon: Database, chevron: true },
  { id: 'tools', label: 'Tools', icon: Wrench, opensToolsFlyout: true, chevron: true },
  { id: 'company-settings', label: 'Company settings', icon: Settings, chevron: true },
  { id: 'global-workforce', label: 'Global workforce', icon: Globe, chevron: true },
  { id: 'app-shop', label: 'App Shop', icon: Store, chevron: true },
  { id: 'help', label: 'Help', icon: HelpCircle, chevron: false },
  { id: 'refer', label: 'Refer a friend', icon: Gift, chevron: false },
];

