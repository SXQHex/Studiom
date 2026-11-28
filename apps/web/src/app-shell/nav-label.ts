import { useTranslation } from "react-i18next"

import type { NavKey } from "@/domain/capabilities/modules"

/**
 * Menu labels. Every key is spelled out, so the type checker and i18next-cli see it,
 * and a menu entry without a label does not compile.
 */
export function useNavLabel() {
  const { t } = useTranslation("nav")
  const labels: Record<NavKey, string> = {
    "center.today": t("center.today.title"),
    "center.today.today": t("center.today.pages.today"),
    "center.program": t("center.program.title"),
    "center.program.calendar": t("center.program.pages.calendar"),
    "center.program.events": t("center.program.pages.events"),
    "center.program.privateRequests": t("center.program.pages.privateRequests"),
    "center.program.waitlists": t("center.program.pages.waitlists"),
    "center.people": t("center.people.title"),
    "center.people.members": t("center.people.pages.members"),
    "center.people.leads": t("center.people.pages.leads"),
    "center.people.applications": t("center.people.pages.applications"),
    "center.people.inbox": t("center.people.pages.inbox"),
    "center.sales": t("center.sales.title"),
    "center.sales.packagePrices": t("center.sales.pages.packagePrices"),
    "center.sales.sales": t("center.sales.pages.sales"),
    "center.sales.debts": t("center.sales.pages.debts"),
    "center.sales.payroll": t("center.sales.pages.payroll"),
    "center.sales.settlement": t("center.sales.pages.settlement"),
    "center.center": t("center.center.title"),
    "center.center.team": t("center.center.pages.team"),
    "center.center.rooms": t("center.center.pages.rooms"),
    "center.center.closures": t("center.center.pages.closures"),
    "center.center.reports": t("center.center.pages.reports"),
    "center.center.audit": t("center.center.pages.audit"),
    "center.center.settings": t("center.center.pages.settings"),
    "organization.definitions": t("organization.definitions.title"),
    "organization.definitions.disciplines": t(
      "organization.definitions.pages.disciplines"
    ),
    "organization.definitions.packages": t(
      "organization.definitions.pages.packages"
    ),
    "organization.definitions.workSchedule": t(
      "organization.definitions.pages.workSchedule"
    ),
    "organization.definitions.templates": t(
      "organization.definitions.pages.templates"
    ),
    "organization.definitions.documents": t(
      "organization.definitions.pages.documents"
    ),
    "organization.definitions.policies": t(
      "organization.definitions.pages.policies"
    ),
    "organization.definitions.automation": t(
      "organization.definitions.pages.automation"
    ),
    "organization.oversight": t("organization.oversight.title"),
    "organization.oversight.exceptions": t(
      "organization.oversight.pages.exceptions"
    ),
    "organization.oversight.people": t("organization.oversight.pages.people"),
    "organization.oversight.calendar": t(
      "organization.oversight.pages.calendar"
    ),
    "organization.oversight.bookings": t(
      "organization.oversight.pages.bookings"
    ),
    "organization.oversight.finance": t("organization.oversight.pages.finance"),
    "organization.oversight.reports": t("organization.oversight.pages.reports"),
    "organization.oversight.audit": t("organization.oversight.pages.audit"),
    "organization.organization": t("organization.organization.title"),
    "organization.organization.overview": t(
      "organization.organization.pages.overview"
    ),
    "organization.organization.profile": t(
      "organization.organization.pages.profile"
    ),
    "organization.organization.centers": t(
      "organization.organization.pages.centers"
    ),
    "organization.organization.team": t("organization.organization.pages.team"),
    "organization.organization.security": t(
      "organization.organization.pages.security"
    ),
    "organization.organization.billing": t(
      "organization.organization.pages.billing"
    ),
    "organization.organization.ownership": t(
      "organization.organization.pages.ownership"
    ),
    "platform.overview": t("platform.overview.title"),
    "platform.overview.overview": t("platform.overview.pages.overview"),
    "platform.tenants": t("platform.tenants.title"),
    "platform.tenants.organizations": t("platform.tenants.pages.organizations"),
    "platform.tenants.trials": t("platform.tenants.pages.trials"),
    "platform.tenants.suspended": t("platform.tenants.pages.suspended"),
    "platform.subscription": t("platform.subscription.title"),
    "platform.subscription.plans": t("platform.subscription.pages.plans"),
    "platform.subscription.subscriptions": t(
      "platform.subscription.pages.subscriptions"
    ),
    "platform.subscription.invoices": t("platform.subscription.pages.invoices"),
    "platform.support": t("platform.support.title"),
    "platform.support.tickets": t("platform.support.pages.tickets"),
    "platform.support.supportSessions": t(
      "platform.support.pages.supportSessions"
    ),
    "platform.support.announcements": t("platform.support.pages.announcements"),
    "platform.system": t("platform.system.title"),
    "platform.system.team": t("platform.system.pages.team"),
    "platform.system.audit": t("platform.system.pages.audit"),
    "platform.system.settings": t("platform.system.pages.settings"),
    "me.home": t("me.home.title"),
    "me.home.home": t("me.home.pages.home"),
    "me.program": t("me.program.title"),
    "me.program.program": t("me.program.pages.program"),
    "me.requests": t("me.requests.title"),
    "me.requests.requests": t("me.requests.pages.requests"),
    "me.wallet": t("me.wallet.title"),
    "me.wallet.wallet": t("me.wallet.pages.wallet"),
    "me.account": t("me.account.title"),
    "me.account.account": t("me.account.pages.account"),
  }
  const lookup: Partial<Record<string, string>> = labels

  return (key: string) => lookup[key] ?? key
}
