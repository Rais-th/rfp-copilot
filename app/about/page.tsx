export default function AboutPage() {
  return (
    <article className="space-y-10 max-w-prose">
      <header className="space-y-2">
        <p className="label">About</p>
        <h1 className="text-3xl font-medium tracking-tight">How it works</h1>
      </header>

      <section className="space-y-3 text-sm leading-relaxed">
        <p>
          RFP Copilot is a lightweight, open source tool that reads Memphis
          public sector solicitations and produces compliant response
          skeletons for minority and women owned small businesses. The goal is
          not to automate proposal writing. The goal is to cut the blank page
          problem from twenty hours of expert time to thirty minutes of
          editing.
        </p>
        <p>
          Every draft is a starting point. You, the business owner, must
          verify every factual claim, every date, every qualification, and
          every certification number before submitting to the City. The tool
          will never submit on your behalf.
        </p>
      </section>

      <section className="space-y-3">
        <p className="label">Data sources</p>
        <ul className="text-sm space-y-1.5">
          <Li>Memphis procurement solicitations portal, public HTML.</Li>
          <Li>Source RFP PDF documents attached to each listing.</Li>
          <Li>Your business profile, stored only in your browser.</Li>
        </ul>
      </section>

      <section className="space-y-3">
        <p className="label">AI stack</p>
        <ul className="text-sm space-y-1.5">
          <Li>Anthropic Claude Sonnet 4.6 for parsing and drafting.</Li>
          <Li>Anthropic Claude Opus 4.7 for strict compliance review.</Li>
          <Li>No model finetuning. No user data used for training.</Li>
        </ul>
      </section>

      <section className="space-y-3">
        <p className="label">Legal</p>
        <p className="text-sm leading-relaxed">
          RFP Copilot generates AI drafts. It is not legal advice. It does not
          create an attorney client relationship. Popuzar LLC makes no
          warranty as to the accuracy or completeness of generated content.
          You are responsible for compliance with all submission requirements,
          including truthfulness of claims. Code is MIT licensed.
        </p>
      </section>

      <section className="space-y-3">
        <p className="label">Contact</p>
        <p className="text-sm">
          Built by Rais Thelemuka, Memphis. Questions:{" "}
          <a
            href="mailto:rthelemuka@gmail.com"
            className="underline underline-offset-4"
          >
            rthelemuka@gmail.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-subtle mono text-xs mt-1">•</span>
      <span>{children}</span>
    </li>
  );
}
