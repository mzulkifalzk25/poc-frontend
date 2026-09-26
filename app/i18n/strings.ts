function waitDuration(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60));
  const seconds = String(totalSeconds % 60);
  if (minutes === "0") {
    return `${seconds} s`;
  }
  return seconds === "0" ? `${minutes} min` : `${minutes} min ${seconds} s`;
}

export const en = {
  common: {
    online: "Online",
    offline: "Offline",
    signOut: "Sign out",
  },
  signIn: {
    offline: "You are offline. Check your connection and try again.",
    cashier: {
      thisPc: (counterName: string) => `${counterName} (this PC)`,
      notActivated: "Not activated on this PC",
      notActivatedHint: "This PC is not set up as a counter yet.",
      activateLink: "Activate this counter",
      nameNotFound: "We could not find that name on this counter.",
      wrongPin: "Wrong PIN. Try again.",
      throttledTitle: "Wrong PIN too many times.",
      throttledWait: (seconds: number) =>
        `Wait ${waitDuration(seconds)}, then try again.`,
    },
  },
} as const;

export type Strings = typeof en;
