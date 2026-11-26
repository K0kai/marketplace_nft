const MAX_REMEMBERED_IDS = 500

type Gated = { eventId: string; version: number; resource: { type: string; id: string } }

/** Decide se um evento ainda é novidade: descarta repetidos e versões que já passaram. */
export class EventGate {
  private seenIds = new Set<string>()
  private versions = new Map<string, number>()

  accept(event: Gated): boolean {
    if (this.seenIds.has(event.eventId)) return false
    this.seenIds.add(event.eventId)
    if (this.seenIds.size > MAX_REMEMBERED_IDS) {
      this.seenIds.delete(this.seenIds.values().next().value!)
    }

    const key = `${event.resource.type}:${event.resource.id}`
    if (event.version <= (this.versions.get(key) ?? 0)) return false
    this.versions.set(key, event.version)
    return true
  }

  reset() {
    this.seenIds.clear()
    this.versions.clear()
  }
}
