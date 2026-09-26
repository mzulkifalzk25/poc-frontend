export interface PeriodicTaskOptions {
  intervalMs: number;
  // Window events that trigger an extra run, for example "online" or "focus".
  triggers?: string[];
  onError?: (error: unknown) => void;
}

// Runs a task now, on a timer and on window events; never two runs at once.
export function startPeriodicTask(
  task: () => Promise<unknown>,
  { intervalMs, triggers = [], onError = () => undefined }: PeriodicTaskOptions,
): () => void {
  let running = false;
  let stopped = false;

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

  run();
  const timer = setInterval(run, intervalMs);
  triggers.forEach((name) => {
    window.addEventListener(name, run);
  });
  return () => {
    stopped = true;
    clearInterval(timer);
    triggers.forEach((name) => {
      window.removeEventListener(name, run);
    });
  };
}
