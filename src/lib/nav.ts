import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Package,
  RotateCw,
  Send,
  Settings2,
  ShoppingCart,
  Store,
  Target,
  Truck,
  UserCircle,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

// Single source for navigation in every portal: sidebar, bottom dock,
// command palette and the sidebar badges all read from here.

export type Role = "ADMIN" | "RESTAURANT" | "GROWER";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  RESTAURANT: "Restaurant",
  GROWER: "Grower",
};

export function toRole(value: unknown): Role {
  return value === "ADMIN" || value === "RESTAURANT" || value === "GROWER" ? value : "GROWER";
}

// V6: the sidebar carries state. Each badge key maps to one count in getShellData().
export type BadgeKey =
  | "restaurantAwaitingPayment"
  | "growerCheckinsDue"
  | "adminDemand"
  | "adminAllocations"
  | "adminDispatch"
  | "adminQc"
  | "adminPayouts";

export type NavBadges = Partial<Record<BadgeKey, number>>;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: BadgeKey;
  /** Position in the admin pipeline (a real sequence, so numbering is meaningful). */
  step?: number;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: Record<Role, NavGroup[]> = {
  GROWER: [
    {
      label: null,
      items: [
        { label: "Dashboard", href: "/grower/dashboard", icon: LayoutDashboard },
        { label: "My Tasks", href: "/grower/tasks", icon: ClipboardList, badge: "growerCheckinsDue" },
        { label: "Earnings", href: "/grower/earnings", icon: Wallet },
        { label: "Profile", href: "/grower/profile", icon: UserCircle },
        { label: "Tutorial", href: "/grower/tutorial", icon: BookOpen },
      ],
    },
  ],
  RESTAURANT: [
    {
      label: null,
      items: [
        { label: "Dashboard", href: "/restaurant/dashboard", icon: LayoutDashboard },
        { label: "New Order", href: "/restaurant/order/new", icon: ShoppingCart },
        { label: "My Orders", href: "/restaurant/orders", icon: Package, badge: "restaurantAwaitingPayment" },
        { label: "Subscriptions", href: "/restaurant/subscriptions", icon: RotateCw },
      ],
    },
  ],
  ADMIN: [
    {
      label: null,
      items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Pipeline",
      items: [
        { label: "Demand Engine", href: "/admin/demand", icon: Settings2, badge: "adminDemand", step: 1 },
        { label: "Allocations", href: "/admin/allocate", icon: Target, badge: "adminAllocations", step: 2 },
        { label: "Dispatch", href: "/admin/dispatch", icon: Send, badge: "adminDispatch", step: 3 },
        { label: "QC Review", href: "/admin/qc", icon: CheckCircle2, badge: "adminQc", step: 4 },
        { label: "Payouts", href: "/admin/payouts", icon: CreditCard, badge: "adminPayouts", step: 5 },
      ],
    },
    {
      label: "Network",
      items: [
        { label: "Growers", href: "/admin/growers", icon: Users },
        { label: "Restaurants", href: "/admin/restaurants", icon: Store },
        { label: "Hubs", href: "/admin/hubs", icon: Warehouse },
        { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "KPI Scorecard", href: "/admin/kpis", icon: Gauge },
      ],
    },
  ],
};

// The portal's main "create" action (top-bar "+" button).
export const PRIMARY_ACTION: Record<Role, { label: string; href: string }> = {
  ADMIN: { label: "New allocation", href: "/admin/allocate" },
  RESTAURANT: { label: "New order", href: "/restaurant/order/new" },
  GROWER: { label: "Check in", href: "/grower/tasks" },
};

// Mobile bottom dock: four destinations plus a "More" sheet with everything else.
export const DOCK_HREFS: Record<Role, string[]> = {
  GROWER: ["/grower/dashboard", "/grower/tasks", "/grower/earnings", "/grower/profile"],
  RESTAURANT: [
    "/restaurant/dashboard",
    "/restaurant/order/new",
    "/restaurant/orders",
    "/restaurant/subscriptions",
  ],
  ADMIN: ["/admin/dashboard", "/admin/qc", "/admin/dispatch", "/admin/payouts"],
};

export function flatNav(role: Role): NavItem[] {
  return NAV_GROUPS[role].flatMap((group) => group.items);
}

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
