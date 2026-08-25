import type { Person, TimePunch } from "./types";

/** Minutes worked from ordered punches in a window (IN/OUT pairs, breaks subtract). */
export function workedMinutes(punches: TimePunch[], fromIso: string, toIso: string) {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  const list = punches
    .filter((p) => {
      const t = new Date(p.at).getTime();
      return t >= from && t <= to;
    })
    .slice()
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  let total = 0;
  let inAt: number | null = null;
  let breakAt: number | null = null;

  for (const punch of list) {
    const t = new Date(punch.at).getTime();
    if (punch.kind === "IN") {
      inAt = t;
    } else if (punch.kind === "OUT" && inAt != null) {
      total += Math.max(0, t - inAt);
      inAt = null;
    } else if (punch.kind === "BREAK_START" && inAt != null) {
      breakAt = t;
    } else if (punch.kind === "BREAK_END" && breakAt != null && inAt != null) {
      total -= Math.max(0, t - breakAt);
      breakAt = null;
    }
  }
  return Math.max(0, Math.floor(total / 60000));
}

export function competenceNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function competenceBounds(competence: string) {
  const [y, m] = competence.split("-").map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { fromIso: start.toISOString(), toIso: end.toISOString() };
}

export function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function mirrorRows(people: Person[], punches: TimePunch[], competence: string) {
  const { fromIso, toIso } = competenceBounds(competence);
  return people
    .filter((p) => p.status === "ACTIVE")
    .map((person) => {
      const mins = workedMinutes(
        punches.filter((p) => p.personId === person.id),
        fromIso,
        toIso,
      );
      return { person, minutes: mins };
    });
}
