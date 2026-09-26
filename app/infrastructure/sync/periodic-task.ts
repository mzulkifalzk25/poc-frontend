export interface DelayedTrigger {
  event: string;
  maxDelayMs: number;
}

export interface PeriodicTaskOptions {
  intervalMs: number;
  // Window events that trigger an extra run, for example "online" or "focus".
  triggers?: string[];
  // Events that trigger a run after a random wait, so many counters do not rush the server together.
  delayedTriggers?: DelayedTrigger[];
  onError?: (error: unknown) => void;
  random?: () => number;
}

// Runs a task now, on a timer and on window events; never two runs at once.
export function startPeriodicTask(
  task: () => Promise<unknown>,
  options: PeriodicTaskOptions,
): () => void {
  const {
    intervalMs,
    triggers = [],
    delayedTriggers = [],
    onError = () => undefined,
    random = Math.random,
  } = options;
  let running = false;
  let stopped = false;
  const pending = new Set<ReturnType<typeof setTimeout>>();

  const run = () => {
    if (running || stopped) {
      return;
    }
    running = true;
    task()
      .catch(onError)
      .finally(() => {
        running = false;
      });
  };

  const delayed = delayedTriggers.map(({ event, maxDelayMs }) => {
    const handler = () => {
      const timer = setTimeout(() => {
        pending.delete(timer);
        run();
      }, random() * maxDelayMs);
      pending.add(timer);
    };
    window.addEventListener(event, handler);
    return { event, handler };
  });

  run();
  const timer = setInterval(run, intervalMs);
  triggers.forEach((name) => {
    window.addEventListener(name, run);
  });
  return () => {
    stopped = true;
    clearInterval(timer);
    pending.forEach(clearTimeout);
    triggers.forEach((name) => {
      window.removeEventListener(name, run);
    });
    delayed.forEach(({ event, handler }) => {
      window.removeEventListener(event, handler);
    });
  };
}
