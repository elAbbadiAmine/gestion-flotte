// Pub/sub minimal pour communiquer entre le link Apollo (hors React) et les composants
const listeners = new Set()

export function onNetworkError(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notifyNetworkError() {
  listeners.forEach(fn => fn())
}
