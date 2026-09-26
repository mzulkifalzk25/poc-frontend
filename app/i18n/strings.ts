function waitDuration(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60));
  const seconds = String(totalSeconds % 60);
  if (minutes === "0") {
    return `${seconds} s`;
  }
  return seconds === "0" ? `${minutes} min` : `${minutes} min ${seconds} s`;
}

function count(value: number): string {
  return value.toLocaleString("en-US");
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
      deactivated: "This PC was deactivated",
      deactivatedHint: "The owner deactivated this counter PC.",
      deactivatedLink: "See what to do",
      nameNotFound: "We could not find that name on this counter.",
      wrongPin: "Wrong PIN. Try again.",
      throttledTitle: "Wrong PIN too many times.",
      throttledWait: (seconds: number) =>
        `Wait ${waitDuration(seconds)}, then try again.`,
    },
  },
  activate: {
    portalTag: "Cashier portal",
    title: "Activate this counter",
    hint: "Enter the code the owner gave you. You only do this once on this PC.",
    codeLabel: "Activation code",
    codeNote:
      "A code works once and expires after 15 minutes. If it does not work, ask the owner for a new one.",
    submit: "Activate",
    submitting: "Activating…",
    errors: {
      code_invalid: "This code is not valid. Check it and try again.",
      code_expired: "This code has expired. Ask the owner for a new one.",
      code_used: "This code was already used. Ask the owner for a new one.",
      offline:
        "You are offline. Activating a counter needs an internet connection.",
      rateLimitedWait: (seconds: number) =>
        `Too many tries. Wait ${waitDuration(seconds)}, then try again.`,
    },
    success: {
      title: (counterName: string) => `This PC is ${counterName}`,
      codeLinePrefix: "Counter code",
      codeLineSuffix: (code: string) =>
        `. Bills from here will start with ${code}.`,
      catalogue: "Catalogue",
      catalogueValue: "Downloads before the first shift",
      cashiers: "Cashiers",
      cashiersValue: (total: number) => `${count(total)} on the sign-in list`,
      cashiersUnknown: "Loads at sign-in",
      offline: "Works offline",
      offlineValue: "After the first download",
      continue: "Continue to sign in",
    },
    help: {
      title: "Where do I get a code?",
      steps: [
        [
          "The owner opens ",
          "Settings",
          " in the admin area and goes to ",
          "Counters",
          ".",
        ],
        ["They pick this counter and tap ", "Generate code", "."],
        ["You type the code here. This PC then remembers its counter."],
      ],
      internetNote:
        "Needs an internet connection for this step only. After that the counter keeps working offline.",
    },
    ownerPrompt: "Store owner?",
    ownerLink: "Sign in to the Admin portal",
  },
  deactivated: {
    title: "This PC was deactivated",
    body: "The owner deactivated this counter PC, so it cannot sell or sign cashiers in any more.",
    counterLine: (counterName: string, code: string) =>
      `It was ${counterName} (code ${code}).`,
    unsyncedNote:
      "Sales that were still waiting on this PC cannot be uploaded any more. Tell the owner.",
    nextStep:
      "To use this PC again, ask the owner for a new activation code in Settings > Counters.",
    reactivate: "Activate with a new code",
  },
} as const;

export type Strings = typeof en;
