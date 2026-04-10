export default function InformationFooter() {
  const privateSessionFormUrl = "https://forms.gle/GAVdcAAB8pMNaZX68";
  const groupGuidanceFormUrl = "https://forms.gle/7LXZheRyPWqQ5V636";

  return (
    <footer className="relative z-20 px-6 pb-16 pt-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="glass-surface rounded-[2rem] border border-aura-gold/15 bg-aura-card/85 px-6 py-8 shadow-[0_0_32px_rgba(28,18,8,0.12)] backdrop-blur md:px-8 md:py-9">
          <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:items-start">
            <div>
              <p className="temple-label">Book & Contact</p>
              <h2 className="mt-3 text-3xl font-semibold text-aura-text md:text-4xl">
                Begin your guided meditation journey
              </h2>
              <p className="aura-copy mt-4 max-w-2xl text-sm leading-6 md:text-base">
                Choose a session format below and complete the short form. We will review your
                request and confirm your schedule within one business day.
              </p>

              <div className="mt-5 flex flex-col gap-3 text-xs uppercase tracking-[0.16em] text-aura-textSoft sm:flex-row sm:flex-wrap">
                <a
                  href={privateSessionFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full border border-aura-gold/30 bg-aura-bg/70 px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.18em] text-aura-text transition hover:-translate-y-0.5 hover:border-aura-gold/45 hover:bg-aura-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-gold/45 sm:w-auto"
                  aria-label="Book a private meditation session"
                >
                  Book Private Session
                </a>
                <a
                  href={groupGuidanceFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full border border-aura-gold/30 bg-aura-bg/70 px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.18em] text-aura-text transition hover:-translate-y-0.5 hover:border-aura-gold/45 hover:bg-aura-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-gold/45 sm:w-auto"
                  aria-label="Join a group meditation guidance session"
                >
                  Join Group Guidance
                </a>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-aura-gold/12 bg-aura-bg/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-aura-gold/85">Contact</p>
                <ul className="mt-3 space-y-2 text-sm text-aura-textSoft">
                  <li>Email: hello@innerpeace.space</li>
                  <li>Phone: +1 (555) 014-8821</li>
                  <li>Hours: Mon-Fri, 9am-6pm</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-aura-gold/12 bg-aura-bg/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-aura-gold/85">Further Information</p>
                <ul className="mt-3 space-y-2 text-sm text-aura-textSoft">
                  <li>Studio: 12 Lotus Lane, Quiet District</li>
                  <li>Response time: within 24 hours</li>
                  <li>Resources: meditation guide and FAQ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
