import { auth, isJwtSessionError } from "@/auth";
import { OAuthSignInLinks } from "@/components/auth/OAuthSignInLinks";
import { LocalChartWorkspace } from "@/components/gantt/LocalChartWorkspace";

export const dynamic = "force-dynamic";

async function getOptionalSession() {
  if (!process.env.AUTH_SECRET) return null;

  try {
    return await auth();
  } catch (error) {
    if (error instanceof Error && isJwtSessionError(error)) return null;
    console.error(
      "[EditorPage::getOptionalSession] Auth session lookup failed",
      error,
    );
    return null;
  }
}

export async function EditorPage() {
  const session = await getOptionalSession();
  const isLoggedIn = Boolean(session?.user?.email);

  return (
    <main className="flex h-screen flex-col gap-3 overflow-hidden bg-slate-100 p-3 text-slate-950">
      <header className="mx-auto w-full max-w-[1800px] shrink-0 rounded-sm border border-slate-300 bg-white">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-sm border-l-4 border-blue-700 px-4 py-2">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-blue-700">
              Ganttfolio
            </p>
            <h1 className="text-lg font-black tracking-tight text-slate-950 md:text-xl">
              Gantt Chart Editor
            </h1>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <p className="max-w-[34rem] truncate border-l border-slate-300 pl-3 text-xs text-slate-600">
              {isLoggedIn
                ? `${session?.user?.email} 계정으로 로그인됨`
                : "로그인 전에는 차트가 이 브라우저에만 저장됩니다."}
            </p>
            {!isLoggedIn && (
              <OAuthSignInLinks className="[&_a]:px-3 [&_a]:py-1.5 [&_a]:text-xs" />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto min-h-0 w-full max-w-[1800px] flex-1 overflow-hidden rounded-sm border border-slate-300 bg-white p-4">
        <LocalChartWorkspace isLoggedIn={isLoggedIn} />
      </div>
    </main>
  );
}
