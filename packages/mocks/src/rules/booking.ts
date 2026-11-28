import { fromDate, toCalendarDate } from "@internationalized/date"
import type {
  PackageTemplate,
  SoldPackage,
} from "@workspace/contracts/commerce"
import type { RuleReason } from "@workspace/contracts/rules"
import type {
  Booking,
  CapacityWarning,
  DanceRole,
  Eligibility,
  Session,
} from "@workspace/contracts/schedule"

/** The local date of a session at its center (ADR-008). */
export function sessionDay(startsAt: string, timeZone: string): string {
  return toCalendarDate(fromDate(new Date(startsAt), timeZone)).toString()
}

/** Bookings that take a place. Waiting and cancelled ones do not. */
function holdsPlace(booking: Booking): boolean {
  return (
    booking.status === "booked" ||
    booking.status === "attended" ||
    booking.status === "no_show"
  )
}

/** Bookings that still tie a person to a session. */
export function isActive(booking: Booking): boolean {
  return holdsPlace(booking) || booking.status === "waitlisted"
}

export function countPlaces(bookings: readonly Booking[]) {
  const placed = bookings.filter(holdsPlace)
  // A makeup fills capacity but does not count toward role balance (ADR-004).
  const dancing = placed.filter((b) => !b.isMakeup)
  return {
    booked: placed.length,
    waitlisted: bookings.filter((b) => b.status === "waitlisted").length,
    leaders: dancing.filter((b) => b.role === "leader").length,
    followers: dancing.filter((b) => b.role === "follower").length,
    takenSeats: placed.flatMap((b) => (b.seat === null ? [] : [b.seat])),
  }
}

/** Seat labels of a session with seat selection: one per place. */
function isSeat(seat: string, capacity: number): boolean {
  const match = /^R([1-9]\d*)$/.exec(seat)
  return match !== null && Number(match[1]) <= capacity
}

export interface PackageWithTemplate {
  package: SoldPackage
  template: PackageTemplate
}

/** Whether a package covers a session: right center, discipline, date and a credit left. */
function covers(
  { package: pkg, template }: PackageWithTemplate,
  session: Session,
  timeZone: string
): boolean {
  const day = sessionDay(session.startsAt, timeZone)
  return (
    pkg.centerId === session.centerId &&
    template.disciplineIds.includes(session.disciplineId) &&
    day >= pkg.startsOn &&
    day < pkg.expiresOn
  )
}

function creditsLeft(pkg: SoldPackage): number {
  return pkg.creditsTotal === null
    ? Number.POSITIVE_INFINITY
    : pkg.creditsTotal - pkg.creditsUsed
}

export interface BookingFacts {
  /** The session to book, or every upcoming session of its series for a series join. */
  targets: readonly { session: Session; bookings: readonly Booking[] }[]
  timeZone: string
  now: Date
  personId: string
  isMember: boolean
  /** The person's packages in this organization. */
  packages: readonly PackageWithTemplate[]
  hasOpenDebt: boolean
  hasWaitlist: boolean
  /** The choices made so far; omitted while only asking whether booking is possible. */
  role?: DanceRole | undefined
  seat?: string | undefined
}

/** Packages that can pay for every target, the one expiring first at the front. */
function payingPackages(facts: BookingFacts): string[] {
  return facts.packages
    .filter(
      (p) =>
        p.package.status === "active" &&
        facts.targets.every((t) => covers(p, t.session, facts.timeZone)) &&
        creditsLeft(p.package) >= facts.targets.length
    )
    .toSorted((a, b) => a.package.expiresOn.localeCompare(b.package.expiresOn))
    .map((p) => p.package.id)
}

/** Why no package can pay: the most useful of the possible explanations. */
function packageProblem(facts: BookingFacts): RuleReason {
  const covering = facts.packages.filter((p) =>
    facts.targets.some((t) => covers(p, t.session, facts.timeZone))
  )
  if (covering.some((p) => p.package.status === "frozen")) {
    return "package_frozen"
  }
  const usable = covering.some(
    (p) => p.package.status === "active" && creditsLeft(p.package) > 0
  )
  if (usable) {
    return facts.targets.length > 1 ? "not_enough_credits" : "no_package"
  }
  // A covering package that ran out is told apart from having none (ADR-021).
  return covering.some((p) => creditsLeft(p.package) <= 0)
    ? "no_credits"
    : "no_package"
}

/** Whether one session has a place for the chosen role and seat. */
function placeProblem(
  target: BookingFacts["targets"][number],
  role: DanceRole | undefined,
  seat: string | undefined
): RuleReason | null {
  const { session, bookings } = target
  const counts = countPlaces(bookings)
  if (counts.booked >= session.capacity) return "full"
  const quota = session.options.roleCapacity
  if (quota !== null) {
    const leadersFull = counts.leaders >= quota.leader
    const followersFull = counts.followers >= quota.follower
    if (
      (role === "leader" && leadersFull) ||
      (role === "follower" && followersFull) ||
      (leadersFull && followersFull)
    ) {
      return "role_full"
    }
  }
  if (session.options.seatSelection && seat !== undefined) {
    if (!isSeat(seat, session.capacity)) return "invalid_seat"
    if (counts.takenSeats.includes(seat)) return "seat_taken"
  }
  return null
}

/** Fullness is the only refusal a manager can confirm away (ADR-021). */
export function isFullness(reason: RuleReason | null): boolean {
  return reason === "full" || reason === "role_full"
}

/**
 * The single booking rule (ADR-004): without an account and a covering right nobody
 * books. The same answer drives the button on screen and the check on write.
 */
export function bookingEligibility(facts: BookingFacts): Eligibility {
  const unit = facts.targets[0]?.session.options.enrollment ?? "session"
  const warnings: Eligibility["warnings"] = facts.hasOpenDebt
    ? ["open_debt"]
    : []
  const answer = (
    reason: RuleReason | null,
    packageIds: string[] = [],
    canWaitlist = false,
    fullSessionIds: string[] = []
  ): Eligibility => ({
    unit,
    allowed: reason === null,
    reason,
    canWaitlist,
    packageIds,
    warnings,
    fullSessionIds,
  })

  if (facts.targets.some((t) => t.session.status === "cancelled")) {
    return answer("session_cancelled")
  }
  if (
    facts.targets.length === 0 ||
    facts.targets.some((t) => Date.parse(t.session.startsAt) <= +facts.now)
  ) {
    return answer("session_started")
  }
  const taken = facts.targets.some((t) =>
    t.bookings.some((b) => b.personId === facts.personId && isActive(b))
  )
  if (taken) return answer("already_booked")
  if (!facts.isMember) return answer("not_a_member")
  const packageIds = payingPackages(facts)
  if (packageIds.length === 0) return answer(packageProblem(facts))
  const problems = facts.targets.flatMap((target) => {
    const problem = placeProblem(target, facts.role, facts.seat)
    return problem === null ? [] : [{ id: target.session.id, problem }]
  })
  // A seat conflict cannot be confirmed away, so it is reported before fullness.
  const blocking =
    problems.find((p) => !isFullness(p.problem)) ?? problems.at(0)
  if (!blocking) return answer(null, packageIds)
  const waitable = isFullness(blocking.problem)
  return answer(
    blocking.problem,
    packageIds,
    // Waiting lists are per session, so a course join cannot queue.
    waitable && unit === "session" && facts.hasWaitlist,
    problems.filter((p) => isFullness(p.problem)).map((p) => p.id)
  )
}

function excess(taken: number, limit: number): number {
  return Math.max(0, taken - limit)
}

/** What is over the limits after a confirmed enrollment or a change. */
export function capacityWarningOf(
  session: Session,
  bookings: readonly Booking[]
): CapacityWarning | null {
  const counts = countPlaces(bookings)
  const quota = session.options.roleCapacity
  const warning = {
    places: excess(counts.booked, session.capacity),
    leader: quota ? excess(counts.leaders, quota.leader) : 0,
    follower: quota ? excess(counts.followers, quota.follower) : 0,
  }
  return warning.places + warning.leader + warning.follower > 0 ? warning : null
}

/** The choices a booking still lacks. */
export function missingChoice(
  session: Session,
  role: DanceRole | undefined,
  seat: string | undefined
): RuleReason | null {
  if (session.options.roleCapacity !== null && role === undefined) {
    return "role_required"
  }
  if (session.options.seatSelection && seat === undefined) {
    return "seat_required"
  }
  return null
}

/** Cancelling is free until the package's cancellation window closes. */
export function isFreeCancellation(
  startsAt: string,
  cancelHours: number,
  now: Date
): boolean {
  return Date.parse(startsAt) - now.getTime() >= cancelHours * 3_600_000
}

/** Takes one credit from a package. */
export function drawCredit(pkg: {
  creditsUsed: number
  creditsTotal: number | null
  status: SoldPackage["status"]
}) {
  pkg.creditsUsed += 1
  if (pkg.creditsTotal !== null && pkg.creditsUsed >= pkg.creditsTotal) {
    pkg.status = "used_up"
  }
}

/** Gives one credit back. */
export function returnCredit(pkg: {
  creditsUsed: number
  status: SoldPackage["status"]
}) {
  pkg.creditsUsed = Math.max(0, pkg.creditsUsed - 1)
  if (pkg.status === "used_up") pkg.status = "active"
}
