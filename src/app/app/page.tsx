import Link from "next/link";
import { auth } from "@/auth";
import { OAuthSignInLinks } from "@/components/auth/OAuthSignInLinks";
import { LocalChartWorkspace } from "@/components/gantt/LocalChartWorkspace";

export const dynamic = "force-dynamic";

const nextSteps = [
  "Use local browser storage for anonymous charts",
  "Sign in with Google or GitHub to persist charts",
  "Sync signed-in charts to MongoDB",
  "Add .ganttfolio import/export",
  "Build split table/timeline workspace",
];

async function getOptionalSession() {
  if (!process.env.AUTH_SECRET) return null;
  return auth();
}

export default async function AppPage() {
  const session = await getOptionalSession();
  const isLoggedIn = Boolean(session?.user?.email);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium text-[var(--color-accent)]">
              Ganttfolio app
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Create now, save to cloud when you sign in
            </h1>
            <p className="mt-2 text-[var(--color-muted)]">
              {isLoggedIn
                ? `Signed in as ${session?.user?.email}`
                : "Not signed in — charts stay in this browser only."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isLoggedIn && <OAuthSignInLinks />}
            <Link
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href="/"
            >
              Back home
            </Link>
          </div>
        </header>

        <LocalChartWorkspace isLoggedIn={isLoggedIn} />

        <aside className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Product structure</h2>
          <ol className="mt-4 grid gap-3 text-sm text-[var(--color-muted)] md:grid-cols-5">
            {nextSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </main>
  );
}
