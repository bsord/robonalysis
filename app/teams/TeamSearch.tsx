"use client";
import { useState } from "react";
import Link from "next/link";

export default function TeamSearch() {
	const [teamName, setTeamName] = useState("");
	const [teamDetails, setTeamDetails] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setTeamDetails(null);
		try {
			const res = await fetch("/api/team", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teamName }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to fetch team details.");
			} else if (Array.isArray(data.data) && data.data.length > 0) {
				setTeamDetails(data.data);
			} else {
				setTeamDetails([]);
			}
		} catch {
			setError("Network error.");
		}
		setLoading(false);
	};

	return (
		<div className="w-full">
			<form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
				<input
					type="text"
					value={teamName}
					onChange={(e) => setTeamName(e.target.value)}
					placeholder="Enter team name (e.g. 1234A)"
					className="border-2 border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-xl px-4 py-3 text-lg transition-all outline-none shadow-sm bg-white/90 dark:bg-slate-900/60 backdrop-blur text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
					required
					autoFocus
				/>
				<button
					type="submit"
					className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-medium shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
					disabled={loading}
				>
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								className="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v8z"
								/>
							</svg>
							Searching...
						</span>
					) : (
						"Get Team Details"
					)}
				</button>
			</form>
			{error && (
				<div className="text-rose-600 dark:text-rose-400 mt-6 text-center font-medium">{error}</div>
			)}
			{Array.isArray(teamDetails) && teamDetails.length > 0 && (
				<div className="mt-10 w-full flex flex-col gap-6">
					{teamDetails.map((team: any, idx: number) => (
						<div
							key={team.id || idx}
							className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6"
						>
							<h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6 text-indigo-400 dark:text-indigo-300"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
								{team.team_name || team.number}{" "}
								<span className="text-gray-500 dark:text-gray-400">
									({team.number})
								</span>
							</h2>
							<div className="mb-1 text-slate-700 dark:text-slate-300">
								<strong>Organization:</strong> {team.organization || "N/A"}
							</div>
							<div className="mb-1 text-slate-700 dark:text-slate-300">
								<strong>Location:</strong> {team.location?.city || "N/A"},
								{" "}
								{team.location?.region || "N/A"}, {team.location?.country || "N/A"}
							</div>
							<div className="mb-1 text-slate-700 dark:text-slate-300">
								<strong>Grade:</strong> {team.grade || "N/A"}
							</div>
							<div className="mb-1 text-slate-700 dark:text-slate-300">
								<strong>Program:</strong> {team.program?.name || "N/A"}
							</div>
							{team.robot_name && (
								<div className="mb-1 text-slate-700 dark:text-slate-300">
									<strong>Robot Name:</strong> {team.robot_name}
								</div>
							)}
							{team.location?.postcode && (
								<div className="mb-1 text-slate-700 dark:text-slate-300">
									<strong>Postcode:</strong> {team.location.postcode}
								</div>
							)}
							<Link
								className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
								href={`/teams/${team.id}`}
							>
								View Team
							</Link>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

