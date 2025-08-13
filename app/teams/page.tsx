import Link from "next/link";
export default function TeamsIndex() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <section className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow-xl p-6 sm:p-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Teams</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">Search for a team to view their profile and event history.</p>
          {/* In future, we can reuse TeamSearch here too */}
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Search for a Team
          </Link>
        </div>
      </section>
    </div>
  );
}
