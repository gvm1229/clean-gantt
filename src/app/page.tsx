import Link from "next/link";
import { CalendarDays, FileJson, ImageDown, PanelsTopLeft } from "lucide-react";

const benefits = [
  {
    icon: PanelsTopLeft,
    title: "표와 일정표를 한 화면에",
    body: "작업 목록과 Gantt 일정을 함께 편집하고, 보기 좋은 이미지로 내보낼 수 있게 준비 중입니다.",
  },
  {
    icon: FileJson,
    title: "가볍게 시작하기",
    body: "로그인 전에는 브라우저에 저장하고, 로그인하면 MongoDB에 안전하게 저장할 수 있습니다.",
  },
  {
    icon: ImageDown,
    title: "공유하기 쉬운 결과물",
    body: "포트폴리오와 보고서에 바로 넣을 수 있는 선명한 이미지 내보내기를 목표로 합니다.",
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
            앱
          </Link>
          <Link
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:bg-[var(--color-accent-strong)]"
            href="/app"
          >
            시작하기
          </Link>
        </div>
      </nav>

      <section className="grid flex-1 items-center gap-10 py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
            웹에서 바로 시작 · 브라우저 우선 저장
          </div>
          <div className="space-y-5">
            <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
              복잡한 도구 없이 보기 좋은 Gantt 차트를 만드세요.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Ganttfolio는 설치 없이 쓰는 Gantt 차트 앱입니다. 먼저 브라우저에서
              만들고, 필요할 때 Google 또는 GitHub로 로그인해 저장할 수 있어요.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              href="/app"
            >
              차트 만들기
            </Link>
            <Link
              className="rounded-full border border-[var(--color-border)] bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
              href="/app"
            >
              계정 없이 계속하기
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--color-border)] bg-white p-5 shadow-2xl shadow-teal-950/10">
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-200">프로젝트 미리보기</p>
                <h2 className="text-xl font-semibold">출시 로드맵</h2>
              </div>
              <span className="rounded-full bg-teal-400/20 px-3 py-1 text-xs text-teal-100">
                1080p 내보내기
              </span>
            </div>
            <div className="space-y-3">
              {["설정", "MongoDB", "작업 공간", "내보내기"].map(
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
