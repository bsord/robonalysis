import TeamQuickSearch from "./components/TeamQuickSearch";

export default function Home() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <section className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow-xl p-6 sm:p-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight text-center">Team Lookup</h1>
          <div className="max-w-xl mx-auto w-full">
            <TeamQuickSearch maxWidthClass="max-w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
