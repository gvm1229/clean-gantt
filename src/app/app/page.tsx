import Link from "next/link";
import { auth, isJwtSessionError } from "@/auth";
import { OAuthSignInLinks } from "@/components/auth/OAuthSignInLinks";
import { LocalChartWorkspace } from "@/components/gantt/LocalChartWorkspace";

export const dynamic = "force-dynamic";

const nextSteps = [
  "로그인 전에는 브라우저에 저장",
  "Google 또는 GitHub로 로그인",
  "로그인한 차트는 MongoDB에 저장",
  ".ganttfolio 가져오기와 내보내기 추가",
  "작업표와 일정표를 나란히 편집",
];

async function getOptionalSession() {
  if (!process.env.AUTH_SECRET) return null;

  try {
    return await auth();
  } catch (error) {
    if (error instanceof Error && isJwtSessionError(error)) return null;
    console.error(
      "[AppPage::getOptionalSession] Auth session lookup failed",
      error,
    );
    return null;
  }
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
              Ganttfolio
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              지금 만들고, 로그인하면 안전하게 저장하세요
            </h1>
            <p className="mt-2 text-[var(--color-muted)]">
              {isLoggedIn
                ? `${session?.user?.email} 계정으로 로그인됨`
                : "로그인 전에는 차트가 이 브라우저에만 저장됩니다."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isLoggedIn && <OAuthSignInLinks />}
            <Link
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href="/"
            >
              처음으로
            </Link>
          </div>
        </header>

        <LocalChartWorkspace isLoggedIn={isLoggedIn} />

        <aside className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">제품 방향</h2>
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
