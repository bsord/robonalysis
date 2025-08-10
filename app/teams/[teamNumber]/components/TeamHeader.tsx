type TeamHeaderProps = {
  team: any;
};

export default function TeamHeader({ team }: TeamHeaderProps) {
  return (
    <section className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow-xl p-6 sm:p-8 mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-3">
        {team.number} <span className="opacity-70">– {team.team_name}</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
        <div>
          <span className="font-medium">Organization:</span> {team.organization}
        </div>
        <div>
          <span className="font-medium">Location:</span> {team.location?.city}, {team.location?.region}, {" "}
          {team.location?.country}
        </div>
        <div>
          <span className="font-medium">Grade:</span> {team.grade}
        </div>
        <div>
          <span className="font-medium">Program:</span> {team.program?.name}
        </div>
      </div>
    </section>
  );
}
