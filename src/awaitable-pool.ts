export type ItemWithID = { id: string; dispose?: () => Promise<void> }

export class AwaitablePool<T extends ItemWithID> {
  private readonly _available: Set<string>
  private readonly _items: Map<string, T>
  private readonly _pendingCheckouts: ((item: T) => void)[]

  constructor(
    private readonly _createItem: () => T,
    private readonly _poolSize: number
  ) {
    this._available = new Set()
    this._items = new Map()
    this._pendingCheckouts = []
  }

  get poolSize() {
    return this._poolSize
  }

  get itemsAvailable() {
    return this._available.size
  }

  get itemsCreated() {
    return this._items.size
  }

  get checkoutsPending() {
    return this._pendingCheckouts.length
  }

  checkout(): Promise<T> {
    const item = this._checkout()
    return item != null
      ? Promise.resolve(item)
      : new Promise((resolve) => this._pendingCheckouts.push(resolve))
  }

  checkin(item: T) {
    if (this._available.has(item.id)) {
      throw new Error('cannot check in item that is not currently checked out')
    }
    if (!this._items.has(item.id)) {
      throw new Error(
        'cannot check in item that was never created nor checked out'
      )
    }
    if (this._pendingCheckouts.length === 0) {
      this._available.add(item.id)
      return
    }
    const pending = this._pendingCheckouts[0]
    this._pendingCheckouts.shift()
    pending(item)
  }

  async dispose() {
    this._available.clear()
    for (const item of this._items.values()) {
      try {
        if (typeof item.dispose === 'function') await item.dispose()
      } catch (err) {
        console.error(`Error when disposing ${item.id}`)
        console.error(err)
      }
    }
  }

  private _checkout(): T | undefined {
    if (this._available.size > 0) {
      const id: string = this._available.keys().next().value
      this._available.delete(id)
      const item = this._items.get(id)
      if (item == null) {
        throw new Error(`available item "${id} not found or null`)
      }
      return item
    }

    // out of connectors and cannot create one without exceeding pool size
    if (this._items.size >= this._poolSize) return

    const item = this._createItem()
    this._items.set(item.id, item)
    return item
  }
}
