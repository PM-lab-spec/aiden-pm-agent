// Simple event emitter for chat session changes (create/update/delete)
type Listener = () => void;
const listeners = new Set<Listener>();

export function onChatSessionChange(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitChatSessionChange() {
  listeners.forEach((fn) => fn());
}
