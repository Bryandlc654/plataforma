import { HiHome, HiSquares2X2, HiBars3, HiEnvelope, HiChartBar, HiMagnifyingGlass, HiUsers, HiClipboardDocumentList, HiCog6Tooth, HiPhone, HiCurrencyDollar, HiLink, HiArrowUpRight, HiKey, HiBolt, HiSparkles, HiShoppingCart, HiCalendarDays, HiTicket, HiPhoto, HiWrenchScrewdriver, HiUserGroup, HiArrowDownTray } from "react-icons/hi2";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HiHome,
  sites: HiSquares2X2,
  forms: HiBars3,
  leads: HiEnvelope,
  analytics: HiChartBar,
  seo: HiMagnifyingGlass,
  users: HiUsers,
  audit: HiClipboardDocumentList,
  settings: HiCog6Tooth,
  whatsapp: HiPhone,
  billing: HiCurrencyDollar,
  integrations: HiLink,
  webhooks: HiArrowUpRight,
  apikeys: HiKey,
  automations: HiBolt,
  ai: HiSparkles,
  ecommerce: HiShoppingCart,
  bookings: HiCalendarDays,
  support: HiTicket,
  media: HiPhoto,
  admintenants: HiSquares2X2,
  adminplans: HiCurrencyDollar,
  admintemplates: HiPhoto,
  adminintegrations: HiWrenchScrewdriver,
  adminusers: HiUserGroup,
  appdownload: HiArrowDownTray,
};

export function AppIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const Icon = iconMap[name] || HiHome;
  return <Icon className={className} />;
}
