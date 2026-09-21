import { Logo } from "~/components/ui/Logo";

const features = [
  "Fast & Reliable Billing",
  "Real-time Inventory",
  "Detailed Reports",
  "Secure & Easy to Use",
];

export function SignInBrandPanel() {
  return (
    <div className="relative hidden w-[800px] flex-shrink-0 overflow-hidden rounded-l-xl bg-navy-deep text-white lg:block">
      <div className="absolute top-8 right-10 h-[220px] w-[300px] rounded-full bg-gold/16 blur-[50px]" />
      <div className="absolute top-[90px] left-[250px] h-[160px] w-[260px] rounded-full bg-white/7 blur-[45px]" />

      <div className="absolute top-11 left-12 flex items-center gap-4">
        <Logo variant="gold" size={66} />
        <div>
          <div className="font-heading text-4xl leading-none font-bold">
            Mart<span className="text-gold">Desk</span>
          </div>
          <div className="text-lg text-[#E6ECF3]">
            POS &amp; Store Management
          </div>
        </div>
      </div>

      <div className="absolute top-[214px] left-12 flex max-w-[400px] flex-col gap-[18px]">
        <div className="font-heading text-4xl leading-[1.16] font-bold tracking-tight">
          Smarter Store Management.
          <br />
          <span className="text-gold">Better Business.</span>
        </div>
        <p className="text-base leading-relaxed text-[#E6ECF3]">
          Manage your products, staff, inventory, sales and reports, all in one
          place.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3.5">
              <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-white/35">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <span className="text-[15px] font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-[34px] left-12 flex items-center gap-2.5 text-sm text-[#C3D0DF]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span className="font-semibold text-white">MartDesk</span>
        <span className="text-[#8FA0B5]">|</span>
        <span>Built for Modern Marts</span>
      </div>
    </div>
  );
}
