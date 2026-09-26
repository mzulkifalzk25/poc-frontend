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
    close: "Close",
    cancel: "Cancel",
    saving: "Saving…",
    working: "Please wait…",
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
      catalogueDownloading: (loaded: number) =>
        loaded > 0 ? `Downloading… ${count(loaded)} products` : "Downloading…",
      catalogueReady: (total: number) => `${count(total)} products ready`,
      catalogueFailed: "Download stopped. It resumes before the first shift.",
      retry: "Try the download again",
      cashiers: "Cashiers",
      cashiersValue: (total: number) => `${count(total)} on the sign-in list`,
      cashiersUnknown: "Loads at sign-in",
      offline: "Works offline",
      offlineValue: "After the first download",
      offlineReady: "Ready",
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
  startShift: {
    title: "Start your shift",
    who: (name: string, counter: string) => `${name} · ${counter}`,
    notYou: "Not you? Sign out",
    cashLabel: "Cash in the drawer right now",
    cashHint:
      "Count the notes and coins before you start. This is checked against your sales when you end the shift.",
    catalogue: "Catalogue",
    catalogueReady: (total: number) => `${count(total)} products ready`,
    catalogueDownloading: (loaded: number) =>
      loaded > 0 ? `Downloading… ${count(loaded)} products` : "Downloading…",
    catalogueFailed: "Download stopped",
    retry: "Try again",
    lastSynced: "Last synced",
    justNow: "Just now",
    minutesAgo: (minutes: number) =>
      minutes < 60
        ? `${count(minutes)} min ago`
        : `${count(Math.floor(minutes / 60))} h ago`,
    notYet: "Not yet",
    scanner: "Scanner",
    scannerValue: "USB, types like a keyboard",
    start: "Start shift",
    starting: "Starting…",
    errors: {
      invalid_amount: "Enter the cash in the drawer, 0 or more.",
      not_synced:
        "The catalogue must finish downloading before the first shift.",
      no_counter: "This PC is not activated as a counter.",
      other_open: (name: string) =>
        `${name}'s shift is still open on this counter. They must end it before a new shift starts.`,
    },
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
  states: {
    loading: "Loading…",
    error: {
      title: "Something went wrong",
      hint: "We could not load this. Check your connection and try again.",
      retry: "Try again",
    },
  },
  admin: {
    paging: {
      label: "Pages",
      showing: (from: number, to: number, total: number) =>
        `Showing ${count(from)}–${count(to)} of ${count(total)}`,
      previous: "Previous",
      next: "Next",
    },
    errors: {
      offline: "You are offline. Check your connection and try again.",
      failed: "Could not save. Try again.",
    },
  },
  categories: {
    title: "Categories",
    subtitle: (categories: number, products: number) =>
      `${count(categories)} categories · ${count(products)} products`,
    add: "Add category",
    newCard: "New category",
    products: "products",
    viewProducts: "View products",
    edit: (name: string) => `Edit ${name}`,
    note: "A category that still has products can't be deleted. Move its products to another category first, and MartDesk will offer to do it for you.",
    empty: {
      title: "No categories yet",
      hint: "Add a category to start sorting your products.",
    },
    saved: (name: string) => `${name} saved`,
    form: {
      addTitle: "Add category",
      editTitle: "Edit category",
      name: "Category name",
      namePlaceholder: "e.g. Frozen food",
      tint: "Colour",
      tintNames: {
        grocery: "Green",
        dairy: "Blue",
        beverages: "Orange",
        snacks: "Pink",
        personal_care: "Purple",
        household: "Teal",
        bakery: "Yellow",
      },
      save: "Save category",
    },
    remove: {
      button: "Delete",
      confirmTitle: (name: string) => `Delete ${name}?`,
      confirmBody:
        "This category has no products. It will be removed for good.",
      confirm: "Delete category",
      blocked: (name: string, products: number) =>
        `${name} still has ${count(products)} products, so it can't be deleted. Move them to another category first.`,
      moveButton: "Move products",
      deleted: (name: string) => `${name} deleted`,
    },
    move: {
      title: "Move products",
      body: (name: string, products: number) =>
        `Move all ${count(products)} products from ${name} to another category. Then ${name} is deleted.`,
      target: "Move to",
      noTarget: "Add another category first, then move the products there.",
      submit: "Move and delete",
      done: (name: string) => `Products moved and ${name} deleted`,
    },
  },
  products: {
    title: "Products",
    subtitle: (products: number, categories: number) =>
      `${count(products)} products across ${count(categories)} categories`,
    importCsv: "Import CSV",
    export: "Export",
    comingLater: "Not in this version yet",
    scanToAdd: "Scan to add",
    addProduct: "Add product",
    search: "Search name or barcode",
    categories: "Categories",
    allCategories: "All",
    more: "More",
    stockFilter: "Stock",
    filters: {
      all: "Stock: All",
      low: "Stock: Low",
      out: "Stock: Out",
      archived: "Archived",
    },
    columns: {
      product: "Product",
      barcode: "Barcode",
      category: "Category",
      price: "Price",
      cost: "Cost",
      stock: "Stock",
      actions: "Actions",
    },
    status: {
      in_stock: "In stock",
      low: "Low",
      out: "Out",
      archived: "Archived",
    },
    noCategory: "No category",
    edit: (name: string) => `Edit ${name}`,
    remove: (name: string) => `Delete ${name}`,
    tableLabel: "Products",
    empty: {
      title: "No products found",
      hint: "Try another search or filter, or scan a barcode to add a product.",
      catalogueTitle: "No products yet",
      catalogueHint: "Scan a barcode to add your first product.",
    },
  },
  productForm: {
    name: "Product name",
    category: "Category",
    chooseCategory: "Choose a category",
    unit: "Unit",
    price: "Selling price (Rs)",
    cost: "Cost price (Rs)",
    fieldErrors: {
      required: "Fill this in.",
      invalid_amount: "Enter a number, 0 or more.",
      invalid_barcode: "Use 4 to 32 letters, digits or dashes.",
    },
  },
  productEdit: {
    title: "Edit product",
    notFound: {
      title: "Product not found",
      hint: "It may have been removed. Close this panel and refresh the list.",
    },
    profit: "Profit per unit",
    profitValue: (money: string, margin: number | null) =>
      margin === null ? money : `${money} · ${String(margin)}% margin`,
    noProfit: "—",
    stock: "Stock on hand",
    adjust: "Adjust",
    lowStock: "Low-stock alert at",
    history: "Price history",
    historyEmpty: "No price changes yet.",
    historyFailed: "Could not load the price history.",
    historyRow: (date: string, who: string) => `${date} · ${who}`,
    historyChange: (oldPrice: string, newPrice: string) =>
      `${oldPrice} to ${newPrice}`,
    save: "Save changes",
    saved: (name: string) => `${name} saved`,
  },
  scanAdd: {
    title: "Scan to add",
    added: (total: number) =>
      total === 1
        ? "1 product added this session"
        : `${count(total)} products added this session`,
    usb: {
      label: "Barcode",
      placeholder: "Scan or type a barcode, then press Enter",
      hint: "The USB scanner types the code and presses Enter for you.",
    },
    tabs: {
      label: "How to scan",
      camera: "Phone camera",
      usb: "USB scanner",
    },
    camera: {
      label: "Camera view",
      rear: "Rear camera",
      starting: "Starting the camera…",
      unsupported:
        "This browser cannot read barcodes with the camera. Use the USB scanner tab.",
      blocked:
        "The camera is blocked or missing. Allow camera access, or use the USB scanner tab.",
    },
    start: "Scan a barcode to start.",
    lookingUp: "Looking up the barcode…",
    detected: "Barcode detected",
    newTitle: "New barcode.",
    newBody: "Not in your catalogue yet.",
    categoryNote: "Category is pre-selected from your last scan.",
    known: (name: string) => `${name} is already in your catalogue`,
    lookupOffline: "You are offline. Looking up a barcode needs a connection.",
    lookupFailed: "Could not look up this barcode. Try again.",
    barcodeExists: "This barcode is already in your catalogue.",
    namePlaceholder: "e.g. Wafer Chocolate 40g",
    stock: "Stock",
    lowStock: "Low-stock alert",
    save: "Save",
    saveNext: "Save & scan next",
    saved: (name: string) => `${name} added`,
  },
  productArchive: {
    dangerTitle: "Delete this product",
    dangerBody:
      "The product is archived, not erased, so past bills and reports stay correct. Counters stop selling it within a minute.",
    delete: "Delete",
    confirmTitle: (name: string) => `Delete ${name}?`,
    confirm: "Archive product",
    archived: (name: string) => `${name} archived`,
    archivedTitle: "This product is archived",
    archivedBody:
      "Counters do not sell it. Restore it to sell it again; its history is kept.",
    restore: "Restore",
    restored: (name: string) => `${name} restored`,
  },
} as const;

export type Strings = typeof en;
