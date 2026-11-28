import {
  BuildingIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CircleUserIcon,
  CreditCardIcon,
  EyeIcon,
  HouseIcon,
  InboxIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

const icons: Partial<Record<string, LucideIcon>> = {
  "center.today": CalendarCheckIcon,
  "center.program": CalendarDaysIcon,
  "center.people": UsersIcon,
  "center.sales": WalletIcon,
  "center.center": Building2Icon,
  "organization.definitions": SlidersHorizontalIcon,
  "organization.oversight": EyeIcon,
  "organization.organization": LandmarkIcon,
  "platform.overview": LayoutDashboardIcon,
  "platform.tenants": BuildingIcon,
  "platform.subscription": CreditCardIcon,
  "platform.support": LifeBuoyIcon,
  "platform.system": SettingsIcon,
  "me.home": HouseIcon,
  "me.program": CalendarDaysIcon,
  "me.requests": InboxIcon,
  "me.wallet": WalletIcon,
  "me.account": CircleUserIcon,
}

export function moduleIcon(key: string): LucideIcon {
  return icons[key] ?? LayoutDashboardIcon
}
