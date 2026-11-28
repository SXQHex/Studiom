import {
  fromDate,
  getDayOfWeek,
  toCalendarDate,
  type CalendarDate,
} from "@internationalized/date"
import { base, de, Faker, tr } from "@faker-js/faker"
import type {
  Booking,
  BookingStatus,
  Session,
} from "@workspace/contracts/schedule"
import type {
  Debt,
  PackageTemplate,
  Payment,
  SoldPackage,
} from "@workspace/contracts/commerce"
import type {
  Center,
  Discipline,
  Organization,
  Room,
} from "@workspace/contracts/organization"
import type { AuditEvent } from "@workspace/contracts/audit"
import type { ExceptionEvent } from "@workspace/contracts/exception"
import type { Binding, Lead, Person } from "@workspace/contracts/person"
import type { Plan } from "@workspace/contracts/plan"
import type { Money } from "@workspace/contracts/primitives"

import {
  crossMembers,
  organizations as organizationSeeds,
  people as namedPeople,
  plans,
  platformTeam,
  type CenterSeed,
  type OrganizationSeed,
  type PersonKey,
  type TemplateSeed,
} from "./catalog"
import { addMinutes, localTimeToUtc, localToday } from "./clock"

/** Every record of the mock world. The store loads it; tests check it. */
export interface Dataset {
  plans: Plan[]
  organizations: Organization[]
  centers: Center[]
  rooms: Room[]
  disciplines: Discipline[]
  people: Person[]
  bindings: Binding[]
  leads: Lead[]
  packageTemplates: PackageTemplate[]
  packages: SoldPackage[]
  payments: Payment[]
  debts: Debt[]
  sessions: Session[]
  bookings: Booking[]
  /** Filled by actions during the session; the seed starts without any. */
  exceptions: ExceptionEvent[]
  audit: AuditEvent[]
}

export interface GenerateOptions {
  /** The instant the world is built around; the seed is relative to it (ADR-007). */
  now: Date
  /** Faker seed: the same seed gives the same names and the same choices. */
  seed?: number
}

/** Days of sessions generated before and after today. */
const scheduleWindow = { pastDays: 14, futureDays: 14 } as const

const defaultSeed = 20_261_128
const dayMs = 86_400_000

export function generateDataset({
  now,
  seed = defaultSeed,
}: GenerateOptions): Dataset {
  const faker = new Faker({ locale: [tr, base] })
  faker.seed(seed)
  const fakerDe = new Faker({ locale: [de, base] })
  fakerDe.seed(seed)

  const nowIso = now.toISOString()
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * dayMs).toISOString()

  const data: Dataset = {
    plans: structuredClone(plans),
    organizations: [],
    centers: [],
    rooms: [],
    disciplines: [],
    people: [],
    bindings: [],
    leads: [],
    packageTemplates: [],
    packages: [],
    payments: [],
    debts: [],
    sessions: [],
    bookings: [],
    exceptions: [],
    audit: [],
  }

  const counters = new Map<string, number>()
  const nextId = (prefix: string) => {
    const value = (counters.get(prefix) ?? 0) + 1
    counters.set(prefix, value)
    return `${prefix}_${String(value).padStart(4, "0")}`
  }

  const emails = new Set<string>()
  const emailFor = (firstName: string, lastName: string) => {
    const stem = `${slug(firstName)}.${slug(lastName)}`
    let email = `${stem}@example.com`
    for (let n = 2; emails.has(email); n++) email = `${stem}${n}@example.com`
    emails.add(email)
    return email
  }

  const addPerson = (
    values: Pick<Person, "id" | "firstName" | "lastName" | "locale">,
    accountStatus: Person["accountStatus"],
    createdAt: string,
    source: Faker
  ): Person => {
    const person: Person = {
      ...values,
      email: emailFor(values.firstName, values.lastName),
      phone: source.phone.number(),
      accountStatus,
      createdAt,
    }
    data.people.push(person)
    return person
  }

  const addBinding = (values: DistributiveOmit<Binding, "id" | "status">) => {
    const created = {
      ...values,
      id: nextId("bnd"),
      status: "active",
    } as Binding
    data.bindings.push(created)
    return created
  }

  // Named people first, so their ids and e-mails stay stable.
  for (const value of Object.values(namedPeople)) {
    addPerson(value, "active", daysAgo(600), faker)
  }

  for (const member of platformTeam) {
    addBinding({
      personId: personId(member.person),
      scope: "platform",
      role: member.role,
      createdAt: daysAgo(700),
    })
  }

  for (const org of organizationSeeds) {
    seedOrganization(org)
  }

  for (const cross of crossMembers) {
    for (const centerId of cross.centerIds) {
      const center = data.centers.find((c) => c.id === centerId)
      if (!center) throw new Error(`Unknown center ${centerId}`)
      addBinding({
        personId: personId(cross.person),
        scope: "member",
        organizationId: center.organizationId,
        homeCenterId: center.id,
        createdAt: daysAgo(90),
      })
    }
  }

  const templatesById = new Map(data.packageTemplates.map((t) => [t.id, t]))
  const centersById = new Map(data.centers.map((c) => [c.id, c]))

  // One package per active membership, sold at the home center.
  for (const binding of data.bindings) {
    if (binding.scope !== "member" || binding.status !== "active") continue
    const center = centersById.get(binding.homeCenterId)
    if (!center) throw new Error(`Unknown center ${binding.homeCenterId}`)
    const options = data.packageTemplates.filter(
      (t) => t.kind !== "trial" && t.centerIds.includes(center.id)
    )
    const template = faker.helpers.arrayElement(options)
    sellPackage(binding.personId, center, template)
  }

  // Freeze a few packages where the plan offers it.
  for (const org of data.organizations) {
    const plan = data.plans.find((p) => p.id === org.planId)
    if (!plan?.features.includes("freeze")) continue
    const candidates = data.packages.filter(
      (p) => p.organizationId === org.id && p.creditsTotal !== null
    )
    for (const pkg of faker.helpers.arrayElements(candidates, 2)) {
      pkg.status = "frozen"
    }
  }

  for (const org of organizationSeeds) {
    for (const center of org.centers) seedSessions(org, center)
  }

  seedBookings()
  settlePackages()

  return data

  function seedOrganization(org: OrganizationSeed) {
    const createdAt = daysAgo(org.ageDays)
    data.organizations.push({
      id: org.id,
      slug: org.slug,
      name: org.name,
      planId: org.planId,
      planVersion: 1,
      status: org.status,
      trialEndsAt:
        org.trialDays === null
          ? null
          : new Date(now.getTime() + org.trialDays * dayMs).toISOString(),
      ownerPersonId: personId(org.owner),
      setupCompleted: org.setupCompleted,
      createdAt,
    })
    addBinding({
      personId: personId(org.owner),
      scope: "organization",
      organizationId: org.id,
      role: "owner",
      createdAt,
    })
    for (const manager of org.managers) {
      addBinding({
        personId: personId(manager),
        scope: "organization",
        organizationId: org.id,
        role: "org_manager",
        createdAt,
      })
    }

    for (const d of org.disciplines) {
      data.disciplines.push({
        id: d.id,
        organizationId: org.id,
        name: d.name,
        kind: d.kind,
        defaults: {
          enrollment: d.enrollment,
          roleBalance: d.roleBalance,
          seatSelection: d.seatSelection,
        },
        status: "active",
      })
    }
    for (const t of org.templates)
      data.packageTemplates.push(toTemplate(org, t))

    for (const center of org.centers) {
      data.centers.push({
        id: center.id,
        organizationId: org.id,
        slug: center.slug,
        name: center.name,
        city: center.city,
        timeZone: center.timeZone,
        currency: center.currency,
        status: center.status,
      })
      for (const room of center.rooms) {
        data.rooms.push({
          id: room.id,
          centerId: center.id,
          name: room.name,
          capacity: room.capacity,
          equipment: room.reformers
            ? { kind: "reformer", units: room.reformers }
            : null,
          status: "active",
        })
      }
      seedCenterPeople(org, center, createdAt)
    }

    seedLeads(org)
  }

  function seedCenterPeople(
    org: OrganizationSeed,
    center: CenterSeed,
    createdAt: string
  ) {
    addBinding({
      personId: personId(center.manager),
      scope: "center",
      organizationId: org.id,
      centerId: center.id,
      role: "center_manager",
      modules: ["program", "people", "sales", "center"],
      createdAt,
    })
    for (const staff of center.staff) {
      addBinding({
        personId: personId(staff.person),
        scope: "center",
        organizationId: org.id,
        centerId: center.id,
        role: "staff",
        modules: staff.modules,
        createdAt,
      })
    }
    for (const [list, role] of [
      [center.instructors, "instructor"],
      [center.assistants, "assistant"],
    ] as const) {
      for (const key of list) {
        addBinding({
          personId: personId(key),
          scope: "instructor",
          organizationId: org.id,
          centerId: center.id,
          role,
          createdAt,
        })
      }
    }

    const source = center.timeZone === "Europe/Berlin" ? fakerDe : faker
    const crossCount = crossMembers.filter((c) =>
      c.centerIds.includes(center.id)
    ).length
    const generated = center.members - crossCount
    for (let i = 0; i < generated; i++) {
      const person = addPerson(
        {
          id: nextId(`per_${center.slug}`),
          firstName: source.person.firstName(),
          lastName: source.person.lastName(),
          locale: source === fakerDe ? "en" : "tr",
        },
        "active",
        daysAgo(faker.number.int({ min: 10, max: org.ageDays })),
        source
      )
      addBinding({
        personId: person.id,
        scope: "member",
        organizationId: org.id,
        homeCenterId: center.id,
        createdAt: person.createdAt,
      })
    }
    // Invitations that are not accepted yet do not count as active students.
    if (center.members > 0) {
      for (let i = 0; i < 2; i++) {
        const person = addPerson(
          {
            id: nextId(`per_${center.slug}_inv`),
            firstName: source.person.firstName(),
            lastName: source.person.lastName(),
            locale: source === fakerDe ? "en" : "tr",
          },
          "invited",
          daysAgo(i + 1),
          source
        )
        const binding = addBinding({
          personId: person.id,
          scope: "member",
          organizationId: org.id,
          homeCenterId: center.id,
          createdAt: person.createdAt,
        })
        binding.status = "invited"
      }
    }
  }

  function seedLeads(org: OrganizationSeed) {
    const trialOffers = plans
      .find((p) => p.id === org.planId)
      ?.features.includes("advancedCrm")
    const statuses: Lead["status"][] = trialOffers
      ? ["new", "trial_offered", "converted", "lost"]
      : ["new", "lost"]
    for (let i = 0; i < org.leads; i++) {
      const center = org.centers[i % org.centers.length]
      if (!center) continue
      const source = center.timeZone === "Europe/Berlin" ? fakerDe : faker
      const created = daysAgo(faker.number.int({ min: 0, max: 20 }))
      const person = addPerson(
        {
          id: nextId(`per_lead_${org.slug}`),
          firstName: source.person.firstName(),
          lastName: source.person.lastName(),
          locale: "tr",
        },
        "none",
        created,
        source
      )
      const status = statuses[i % statuses.length] ?? "new"
      data.leads.push({
        id: nextId("lead"),
        organizationId: org.id,
        centerId: center.id,
        personId: person.id,
        source: i % 3 === 0 ? "manual" : "public_form",
        interest: i % 2 === 0 ? "trial" : "info",
        status,
        note: status === "lost" ? "Saatler uymadı." : null,
        followUpOn:
          status === "new" || status === "trial_offered"
            ? localToday(now, center.timeZone)
                .add({ days: 1 + i })
                .toString()
            : null,
        createdAt: created,
      })
    }
  }

  function sellPackage(
    buyerId: string,
    center: Center,
    template: PackageTemplate
  ) {
    const today = localToday(now, center.timeZone)
    // About one in ten packages ends in three days ("3 gün sonra biten paket").
    const endsSoon = faker.datatype.boolean({ probability: 0.1 })
    const startOffset = endsSoon
      ? template.validityDays - 3
      : faker.number.int({
          min: 1,
          max: Math.min(25, template.validityDays - 4),
        })
    const startsOn = today.subtract({ days: startOffset })
    const expiresOn = startsOn.add({ days: template.validityDays })
    const discount = faker.helpers.weightedArrayElement([
      { weight: 80, value: 0 },
      { weight: 17, value: faker.number.int({ min: 5, max: 10 }) },
      // Over 15% off the suggested price lands in Exceptions (ADR-004).
      { weight: 3, value: 20 },
    ])
    const price: Money = {
      amountMinor:
        Math.round(
          (template.suggestedPrice.amountMinor * (100 - discount)) / 10_000
        ) * 100,
      currency: template.suggestedPrice.currency,
    }
    const soldAt = localTimeToUtc(startsOn, "11:00", center.timeZone)
    const pkg: SoldPackage = {
      id: nextId("pkg"),
      organizationId: center.organizationId,
      centerId: center.id,
      personId: buyerId,
      templateId: template.id,
      templateVersion: template.version,
      soldAt,
      startsOn: startsOn.toString(),
      expiresOn: expiresOn.toString(),
      creditsTotal:
        template.credits.kind === "limited" ? template.credits.count : null,
      creditsUsed: 0,
      makeupsUsed: 0,
      price,
      status: "active",
    }
    data.packages.push(pkg)

    const paid = faker.helpers.weightedArrayElement([
      { weight: 80, value: 1 },
      { weight: 15, value: 0.5 },
      { weight: 5, value: 0 },
    ])
    const paidMinor = Math.round((price.amountMinor * paid) / 100) * 100
    if (paidMinor > 0) {
      data.payments.push({
        id: nextId("pay"),
        organizationId: pkg.organizationId,
        centerId: pkg.centerId,
        personId: buyerId,
        packageId: pkg.id,
        kind: "payment",
        method: faker.helpers.arrayElement(["cash", "card", "transfer"]),
        amount: { amountMinor: paidMinor, currency: price.currency },
        paidAt: soldAt,
        reason: null,
      })
    }
    const unpaid = price.amountMinor - paidMinor
    if (unpaid > 0) {
      data.debts.push({
        id: nextId("debt"),
        organizationId: pkg.organizationId,
        centerId: pkg.centerId,
        personId: buyerId,
        packageId: pkg.id,
        amount: { amountMinor: unpaid, currency: price.currency },
        dueOn: startsOn.add({ days: 14 }).toString(),
        status: "open",
      })
    }
  }

  function seedSessions(org: OrganizationSeed, center: CenterSeed) {
    const today = localToday(now, center.timeZone)
    const disciplines = new Map(org.disciplines.map((d) => [d.id, d]))
    const rooms = new Map(center.rooms.map((r) => [r.id, r]))
    center.schedule.forEach((slot, index) => {
      const discipline = disciplines.get(slot.disciplineId)
      const room = rooms.get(slot.roomId)
      if (!discipline || !room) throw new Error(`Bad slot in ${center.id}`)
      const seriesId = `ser_${center.slug}_${index + 1}`
      for (
        let offset = -scheduleWindow.pastDays;
        offset <= scheduleWindow.futureDays;
        offset++
      ) {
        const date = today.add({ days: offset })
        if (!slot.weekdays.includes(isoWeekday(date))) continue
        const startsAt = localTimeToUtc(date, slot.time, center.timeZone)
        data.sessions.push({
          id: nextId(`ses_${center.slug}`),
          centerId: center.id,
          roomId: room.id,
          disciplineId: discipline.id,
          instructorId: personId(slot.instructor),
          assistantIds: slot.assistant ? [personId(slot.assistant)] : [],
          startsAt,
          endsAt: addMinutes(startsAt, slot.minutes),
          capacity: room.reformers ?? room.capacity,
          level: slot.level,
          options: {
            enrollment: discipline.enrollment,
            roleCapacity: discipline.roleBalance
              ? halves(room.reformers ?? room.capacity)
              : null,
            seatSelection: discipline.seatSelection,
            levelPrerequisite:
              slot.level === "advanced" ? "intermediate" : null,
          },
          seriesId,
          sales:
            discipline.enrollment === "series" && offset === 2
              ? "closed"
              : "open",
          status: "scheduled",
          cancelReason: null,
        })
      }
    })
    // One upcoming session is cancelled, with its reason.
    const upcoming = data.sessions.find(
      (s) =>
        s.centerId === center.id && s.startsAt > addMinutes(nowIso, 24 * 60)
    )
    if (upcoming && center.id === "ctr_pro_kadikoy") {
      upcoming.status = "cancelled"
      upcoming.cancelReason = "Eğitmen rahatsızlığı nedeniyle iptal edildi."
    }
  }

  function seedBookings() {
    const orgFeatures = new Map(
      data.organizations.map((o) => [
        o.id,
        new Set(data.plans.find((p) => p.id === o.planId)?.features ?? []),
      ])
    )
    const packagesByCenter = new Map<string, SoldPackage[]>()
    for (const pkg of data.packages) {
      const list = packagesByCenter.get(pkg.centerId) ?? []
      list.push(pkg)
      packagesByCenter.set(pkg.centerId, list)
    }
    const used = new Map<string, number>()
    // How many credits each limited package spends in the seed. Most keep some, so
    // members can still book; a few are used up.
    const budget = new Map(
      data.packages.map((pkg) => {
        const total = pkg.creditsTotal ?? Number.POSITIVE_INFINITY
        if (pkg.creditsTotal === null) return [pkg.id, total] as const
        const spends = faker.datatype.boolean({ probability: 0.12 })
          ? total
          : faker.number.int({ min: Math.floor(total / 4), max: total - 2 })
        return [pkg.id, spends] as const
      })
    )
    const makeups = new Map<string, number>()

    const sessions = [...data.sessions].toSorted((a, b) =>
      a.startsAt.localeCompare(b.startsAt)
    )
    for (const session of sessions) {
      // Closed sessions take no bookings (ADR-021).
      if (session.sales === "closed") continue
      const center = centersById.get(session.centerId)
      if (!center) continue
      const isPast = session.endsAt <= nowIso
      const sessionDay = toCalendarDate(
        fromDate(new Date(session.startsAt), center.timeZone)
      ).toString()
      const eligible = (packagesByCenter.get(center.id) ?? []).filter((pkg) => {
        const template = templatesById.get(pkg.templateId)
        if (!template?.disciplineIds.includes(session.disciplineId))
          return false
        if (pkg.status === "frozen") return false
        if (sessionDay < pkg.startsOn || sessionDay >= pkg.expiresOn)
          return false
        return (used.get(pkg.id) ?? 0) < (budget.get(pkg.id) ?? 0)
      })
      const daysAhead = (Date.parse(session.startsAt) - now.getTime()) / dayMs
      const fill = isPast
        ? faker.number.float({ min: 0.55, max: 1 })
        : faker.number.float({
            min: Math.max(0.2, 0.9 - daysAhead * 0.05),
            max: 1,
          })
      const target = Math.min(
        session.capacity,
        Math.round(session.capacity * fill)
      )
      // Packages made for one discipline go first, so mixed ones last for the rest.
      const breadth = (pkg: SoldPackage) =>
        templatesById.get(pkg.templateId)?.disciplineIds.length ?? 0
      const chosen = faker.helpers
        .shuffle(eligible)
        .toSorted((a, b) => breadth(a) - breadth(b))
        .slice(0, target)
      chosen.forEach((pkg, index) => {
        const template = templatesById.get(pkg.templateId)
        let status: BookingStatus = "booked"
        if (session.status === "cancelled") status = "cancelled"
        else if (isPast)
          status = faker.datatype.boolean({ probability: 0.9 })
            ? "attended"
            : "no_show"
        else if (faker.datatype.boolean({ probability: 0.04 }))
          status = "cancelled"
        const makeupMax =
          template?.makeup.allowed === true ? template.makeup.max : 0
        const isMakeup =
          status !== "cancelled" &&
          (makeups.get(pkg.id) ?? 0) < makeupMax &&
          faker.datatype.boolean({ probability: 0.03 })
        if (status !== "cancelled")
          used.set(pkg.id, (used.get(pkg.id) ?? 0) + 1)
        if (isMakeup) makeups.set(pkg.id, (makeups.get(pkg.id) ?? 0) + 1)
        data.bookings.push({
          id: nextId("bkg"),
          sessionId: session.id,
          personId: pkg.personId,
          packageId: pkg.id,
          status,
          role: session.options.roleCapacity
            ? index % 2 === 0
              ? "leader"
              : "follower"
            : null,
          seat: session.options.seatSelection ? `R${index + 1}` : null,
          isMakeup,
          priority:
            session.options.enrollment === "series" &&
            template?.kind === "course",
          attendanceTakenBy:
            status === "attended" || status === "no_show"
              ? (session.assistantIds[0] ?? session.instructorId)
              : null,
          createdAt: addMinutes(
            session.startsAt,
            -faker.number.int({ min: 60, max: 7 * 24 * 60 })
          ),
        })
      })

      // A full upcoming session gets a short waiting list where the plan offers one.
      const full =
        chosen.length >= session.capacity &&
        !isPast &&
        session.status === "scheduled"
      if (full && orgFeatures.get(center.organizationId)?.has("waitlist")) {
        const waiting = eligible.filter((p) => !chosen.includes(p)).slice(0, 2)
        for (const pkg of waiting) {
          data.bookings.push({
            id: nextId("bkg"),
            sessionId: session.id,
            personId: pkg.personId,
            packageId: pkg.id,
            status: "waitlisted",
            role: null,
            seat: null,
            isMakeup: false,
            priority: false,
            attendanceTakenBy: null,
            createdAt: addMinutes(
              session.startsAt,
              -faker.number.int({ min: 60, max: 3 * 24 * 60 })
            ),
          })
        }
      }
    }

    for (const pkg of data.packages) {
      pkg.creditsUsed = used.get(pkg.id) ?? 0
      pkg.makeupsUsed = makeups.get(pkg.id) ?? 0
    }
  }

  function settlePackages() {
    for (const pkg of data.packages) {
      if (pkg.status === "frozen") continue
      if (pkg.creditsTotal !== null && pkg.creditsUsed >= pkg.creditsTotal) {
        pkg.status = "used_up"
      }
    }
  }
}

function toTemplate(org: OrganizationSeed, t: TemplateSeed): PackageTemplate {
  return {
    id: t.id,
    organizationId: org.id,
    version: 1,
    name: t.name,
    kind: t.kind,
    disciplineIds: t.disciplineIds,
    credits:
      t.credits === null
        ? { kind: "unlimited" }
        : { kind: "limited", count: t.credits },
    validityDays: t.validityDays,
    freezeDays: t.freezeDays,
    cancelHours: t.cancelHours,
    centerIds: t.centerIds,
    suggestedPrice: { amountMinor: t.price * 100, currency: t.currency },
    makeup:
      t.makeupMax > 0
        ? { allowed: true, max: t.makeupMax }
        : { allowed: false },
    status: "active",
  }
}

function personId(key: PersonKey) {
  return namedPeople[key].id
}

function slug(text: string) {
  return text
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "")
}

/** The seed splits the places between the two roles; managers change them by hand. */
function halves(capacity: number) {
  return { leader: Math.ceil(capacity / 2), follower: Math.floor(capacity / 2) }
}

/** ISO weekday of a calendar date, 1 = Monday … 7 = Sunday. */
function isoWeekday(date: CalendarDate): number {
  // en-GB starts the week on Monday, so the zero-based index maps directly.
  return getDayOfWeek(date, "en-GB") + 1
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never
