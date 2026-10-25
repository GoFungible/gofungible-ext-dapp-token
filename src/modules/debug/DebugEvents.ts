export const DebugEvents = {
  COLLECT: 'debug:collect',
  STATE: 'debug:state',
  TOGGLE: 'debug:toggle',
  OPEN: 'debug:open',
  CLOSE: 'debug:close',
} as const;

export type DebugEvent = typeof DebugEvents[keyof typeof DebugEvents];