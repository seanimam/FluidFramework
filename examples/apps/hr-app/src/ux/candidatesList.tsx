import { useEffect, useState } from "react";
import { Candidate, Job } from "../schema.js";
import { Tree } from "fluid-framework";
import React from "react";
import { AvailabilityView } from "./availabilityView.js";

export function CandidatesList(props: {
	job: Job;
	selectedCandidate: Candidate | undefined;
	onCandidateClick: (candidate: Candidate) => void;
}): JSX.Element {
	return (
		<div className="flex flex-col gap-1 content-center m-2 w-96 h-full overflow-y-auto">
			<div className="text-lg font-extrabold bg-transparent text-black">Candidates</div>
			{props.job.candidates.length === 0 ? (
				<div className="text-gray-500">No candidates yet!</div>
			) : (
				props.job.candidates.map((candidate, index) => (
					<CandidateView
						key={index}
						candidate={candidate}
						isSelected={props.selectedCandidate === candidate}
						onClick={() => props.onCandidateClick(candidate)}
					/>
				))
			)}
		</div>
	);
}

export function CandidateView(props: {
	candidate: Candidate;
	isSelected: boolean;
	onClick: () => void;
}): JSX.Element {
	const [name, setName] = useState(props.candidate.name);
	const [yearsOfExperience, setYearsOfExperience] = useState(props.candidate.yearsOfExperience);

	// Register for change events on the list when the component mounts.
	// Any time the list changes, the app will update
	useEffect(() => {
		const unsubscribe = Tree.on(props.candidate, "nodeChanged", () => {
			setName(props.candidate.name);
			setYearsOfExperience(props.candidate.yearsOfExperience);
		});
		return unsubscribe;
	}, []);

	return (
		<div
			className={`flex flex-col gap-1 justify-center content-center m-1 p-2 cursor-pointer
                ${props.isSelected ? "bg-blue-300" : "bg-slate-100 hover:bg-slate-200"}
           `}
			onClick={props.onClick}
		>
			<div className="mb-3">
				<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
					Candidate Name:
				</label>
				<input
					className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					value={name}
					onChange={(event) => (props.candidate.name = event.target.value)}
				/>
			</div>
			<div className="mb-3">
				<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
					Years of Experience:
				</label>
				<input
					className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					value={yearsOfExperience}
					onChange={(event) =>
						(props.candidate.yearsOfExperience = Number(event.target.value))
					}
				/>
			</div>
			<AvailabilityView avail={props.candidate.availability} />
		</div>
	);
}
