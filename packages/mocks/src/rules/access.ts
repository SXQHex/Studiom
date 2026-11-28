import type { Binding, StaffModule } from "@workspace/contracts/person"
import type { Session } from "@workspace/contracts/schedule"

/** Who may do what, per binding (ADR-003). A module never merges permissions (ADR-001). */

/** A center binding of this center that opens at least one of the modules. */
export function worksAtCenter(
  bindings: readonly Binding[],
  centerId: string,
  modules: readonly StaffModule[]
): boolean {
  return bindings.some(
    (b) =>
      b.scope === "center" &&
      b.centerId === centerId &&
      (b.role === "center_manager" ||
        b.modules.some((m) => modules.includes(m)))
  )
}

/** Organization owners and managers look at center data but never write it. */
export function overseesOrganization(
  bindings: readonly Binding[],
  organizationId: string
): boolean {
  return bindings.some(
    (b) => b.scope === "organization" && b.organizationId === organizationId
  )
}

/** The session's instructor or one of its assigned assistants. */
function teachesSession(session: Session, personId: string): boolean {
  return (
    session.instructorId === personId || session.assistantIds.includes(personId)
  )
}

/** Editing, moving, resizing and cancelling needs the center's program module. */
export function mayManageSessions(
  bindings: readonly Binding[],
  centerId: string
): boolean {
  return worksAtCenter(bindings, centerId, ["program"])
}

/** Only a center manager still writes once the session ended (ADR-021). */
function isCenterManager(
  bindings: readonly Binding[],
  centerId: string
): boolean {
  return bindings.some(
    (b) =>
      b.scope === "center" &&
      b.centerId === centerId &&
      b.role === "center_manager"
  )
}

export function hasEnded(session: Session, now: Date): boolean {
  return now.getTime() >= Date.parse(session.endsAt)
}

export function mayTakeAttendance(
  bindings: readonly Binding[],
  session: Session,
  personId: string,
  now: Date
): boolean {
  if (hasEnded(session, now)) {
    return isCenterManager(bindings, session.centerId)
  }
  return (
    teachesSession(session, personId) ||
    worksAtCenter(bindings, session.centerId, ["program"])
  )
}

export function maySeeRoster(
  bindings: readonly Binding[],
  session: Session,
  personId: string,
  organizationId: string
): boolean {
  return (
    teachesSession(session, personId) ||
    worksAtCenter(bindings, session.centerId, ["program", "people"]) ||
    overseesOrganization(bindings, organizationId)
  )
}

/** Booking and cancelling for a member: the member, or their center's desk. */
export function mayBookFor(
  bindings: readonly Binding[],
  centerId: string,
  actorId: string,
  personId: string
): boolean {
  return (
    actorId === personId ||
    worksAtCenter(bindings, centerId, ["program", "people", "sales"])
  )
}
