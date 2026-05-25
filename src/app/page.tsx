import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-8">
        <nav className="flex items-center justify-between border-b border-neutral-200 pb-5">
          <p className="text-xl font-semibold">Syncro</p>
          <div className="flex gap-3">
            <Link href="/auth/login" className="rounded-md px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-950">
              Sign in
            </Link>
            <Link href="/auth/signup" className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
              Start
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 gap-12 py-12 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Company task tracker</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
              Syncro
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Create teams, assign private employee tasks, collect README-style submissions, and mark attendance in one company workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="rounded-md bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">
                Create workspace
              </Link>
              <Link href="/dashboard" className="rounded-md border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:border-neutral-950">
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <p className="text-sm text-neutral-500">Today</p>
                <p className="font-semibold">Project lead workspace</p>
              </div>
              <span className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700">Live</span>
            </div>
            <div className="grid gap-3">
              {['Assign README task', 'Employee submits work', 'Attendance marked'].map((item, index) => (
                <div key={item} className="rounded-md border border-neutral-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-medium">{item}</p>
                    <p className="font-mono text-sm text-neutral-400">0{index + 1}</p>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-neutral-950" style={{ width: `${40 + index * 25}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
