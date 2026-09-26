import { t } from "~/i18n/t";

function StepText({ parts }: { parts: readonly string[] }) {
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <b key={index} className="text-text">
            {part}
          </b>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function ActivateHelp() {
  const strings = t().activate.help;
  return (
    <div className="flex w-[440px] flex-col justify-between bg-off-white p-10">
      <div className="flex flex-col gap-5">
        <h2 className="font-heading text-[22px] font-bold">{strings.title}</h2>
        <ol className="flex flex-col gap-4">
          {strings.steps.map((parts, index) => (
            <li key={index} className="flex items-start gap-3.5">
              <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border border-border bg-white font-mono text-sm font-semibold">
                {index + 1}
              </span>
              <span className="text-[15px] leading-normal text-[#34445A]">
                <StepText parts={parts} />
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="rounded-xl border border-border bg-white p-3.5 text-[13px] leading-normal text-[#34445A]">
        {strings.internetNote}
      </p>
    </div>
  );
}
