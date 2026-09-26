import { Logo } from "~/components/ui/Logo";
import { t } from "~/i18n/t";

export function SignInBrandPanel() {
  const strings = t().signIn.panel;
  return (
    <div className="relative hidden w-[800px] flex-shrink-0 overflow-hidden rounded-s-xl bg-navy-deep text-white lg:block">
      <div className="absolute end-10 top-8 h-[220px] w-[300px] rounded-full bg-gold/16 blur-[50px]" />
      <div className="absolute start-[250px] top-[90px] h-[160px] w-[260px] rounded-full bg-white/7 blur-[45px]" />

      <div className="absolute start-12 top-11 flex items-center gap-4">
        <Logo variant="gold" size={66} />
        <div>
          <div className="font-heading text-4xl leading-none font-bold">
            Mart<span className="text-gold">Desk</span>
          </div>
          <div className="text-lg text-[#E6ECF3]">{t().brand.tagline}</div>
        </div>
      </div>

      <div className="absolute start-12 top-[214px] flex max-w-[400px] flex-col gap-[18px]">
        <div className="font-heading text-4xl leading-[1.16] font-bold tracking-tight">
          {strings.headline}
          <br />
          <span className="text-gold">{strings.headlineAccent}</span>
        </div>
        <p className="text-base leading-relaxed text-[#E6ECF3]">
          {strings.copy}
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {strings.features.map((feature) => (
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

      <div className="absolute start-12 bottom-[34px] flex items-center gap-2.5 text-sm text-[#C3D0DF]">
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
        <span>{strings.builtFor}</span>
      </div>
    </div>
  );
}
