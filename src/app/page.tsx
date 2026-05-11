import Link from "next/link";
import { CalendarDays, FileJson, ImageDown, PanelsTopLeft } from "lucide-react";

const benefits = [
  {
    icon: PanelsTopLeft,
    title: "Split workspace ready",
    body: "Planned for a table + timeline editor while keeping the current presentation-grade export mode.",
  },
  {
    icon: FileJson,
    title: "Portable by design",
    body: "Anonymous charts stay in localStorage; signed-in users can persist to MongoDB later.",
  },
  {
    icon: ImageDown,
    title: "Export-first workflow",
    body: "The existing JPG export direction remains a core differentiator for portfolio-ready charts.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between rounded-full border border-[var(--color-border)] bg-white/80 px-5 py-3 shadow-sm backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <CalendarDays className="h-5 w-5 text-[var(--color-accent)]" />
          <span>Ganttfolio</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link
            className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            href="/app"
          >
            App
          </Link>
          <Link
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:bg-[var(--color-accent-strong)]"
            href="/app"
          >
            Start planning
          </Link>
        </div>
      </nav>

      <section className="grid flex-1 items-center gap-10 py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
            Hosted app setup · local-first charts
          </div>
          <div className="space-y-5">
            <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Visual-first Gantt charts without the heavyweight project suite.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Ganttfolio is being structured as a hosted app: anyone can create
              charts in the browser, then sign in with Google or GitHub when
              they want cloud persistence.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              href="/app"
            >
              Create a browser chart
            </Link>
            <a
              className="rounded-full border border-[var(--color-border)] bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
              href="https://github.com/"
              rel="noreferrer"
            >
              Repo link pending
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--color-border)] bg-white p-5 shadow-2xl shadow-teal-950/10">
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-200">Project preview</p>
                <h2 className="text-xl font-semibold">Launch roadmap</h2>
              </div>
              <span className="rounded-full bg-teal-400/20 px-3 py-1 text-xs text-teal-100">
                1080p export
              </span>
            </div>
            <div className="space-y-3">
              {["Setup", "MongoDB", "Workspace", "Export"].map(
                (label, index) => (
                  <div
                    key={label}
                    className="grid grid-cols-[7rem_1fr] items-center gap-3"
                  >
                    <span className="text-sm text-slate-300">{label}</span>
                    <span
                      className="h-7 rounded-full bg-teal-400"
                      style={{
                        marginLeft: `${index * 12}%`,
                        width: `${44 - index * 4}%`,
                      }}
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-12 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm"
          >
            <Icon className="mb-4 h-6 w-6 text-[var(--color-accent)]" />
            <h2 className="mb-2 font-semibold">{title}</h2>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {body}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
