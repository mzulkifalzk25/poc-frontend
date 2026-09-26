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
  brand: {
    tagline: "POS & Store Management",
    footer: "MartDesk POS",
  },
  signIn: {
    version: "Version 1.0 (POC)",
    welcome: "Welcome back!",
    chooseRole: "Please select your role and sign in to continue.",
    signingIn: "Signing in…",
    roles: {
      cashier: {
        label: "Cashier",
        description: ["Access the POS and", "manage sales"],
      },
      admin: {
        label: "Admin",
        description: ["Manage store, inventory,", "staff and reports"],
      },
    },
    panel: {
      headline: "Smarter Store Management.",
      headlineAccent: "Better Business.",
      copy: "Manage your products, staff, inventory, sales and reports, all in one place.",
      features: [
        "Fast & Reliable Billing",
        "Real-time Inventory",
        "Detailed Reports",
        "Secure & Easy to Use",
      ],
      builtFor: "Built for Modern Marts",
    },
    admin: {
      login: "Email or username",
      loginPlaceholder: "Enter your email or username",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      forgotPassword: "Forgot password?",
      showPassword: "Show or hide password",
      keepSignedIn: "Keep me signed in on this device",
      note: "Owners and managers sign in here with a password. Cashiers use their PIN at the counter. The owner resets a forgotten password.",
      submit: "Sign In to Admin",
      invalidCredentials: "Wrong email, username or password.",
    },
    offline: "You are offline. Check your connection and try again.",
    cashier: {
      counter: "Counter",
      name: "Cashier name",
      namePlaceholder: "Enter your name",
      pin: "PIN",
      pinPlaceholder: "Enter your 4-digit PIN",
      showPin: "Show or hide PIN",
      submit: "Sign In",
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
