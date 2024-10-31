/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useEffect, useState } from "react";
import { TreeView, Tree, IServiceAudience, IMember } from "fluid-framework";
import {
	Candidate,
	HRData,
	Job,
	JobsArray,
	treeConfiguration,
	type OnSiteSchedule,
} from "./schema.js";
import { AzureMember } from "@fluidframework/azure-client";
import { OdspMember } from "@fluidframework/odsp-client/beta";
import { AzureFacepile } from "./facepiles/azureFacepile.js";
import { SpeFacepile } from "./facepiles/speFacepile.js";
import { IPresence } from "@fluid-experimental/presence";
import { Button, FluentProvider, webLightTheme } from "@fluentui/react-components";
import { createTestJob } from "./index.js";
import { aiCollab, type AiCollabOptions } from "@fluid-experimental/ai-collab";
import { AzureOpenAI } from "openai";
import { getBranch } from "@fluidframework/tree/alpha";
import { InterviewerList } from "./ux/interviewerList.js";
import { OnSitePlan } from "./ux/onSitePlan.js";
import { CandidatesList } from "./ux/candidatesList.js";
import { DismissRegular } from "@fluentui/react-icons";

export function HRApp(props: {
	data: TreeView<typeof HRData>;
	audience: IServiceAudience<IMember>;
	presence: IPresence;
}): JSX.Element {
	const [selectedJob, setSelectedJob] = useState<Job>();
	const [selectedCandidate, setSelectedCandidate] = useState<Candidate>();
	const [openDrawer, setOpenDrawer] = useState(false);
	const [onsiteScheduleSelectedCandidate, setOnsiteScheduleSelectedCandidate] =
		useState<OnSiteSchedule>();

	const handleJobClick = (job: Job) => {
		setSelectedJob(job);
		setSelectedCandidate(undefined);
	};

	const handleCandidateClick = (candidate: Candidate) => {
		setSelectedCandidate(candidate);
		selectedJob?.onSiteSchedule.forEach((onSiteSchedule) => {
			if (onSiteSchedule.candidateId === candidate.candidateId) {
				setOnsiteScheduleSelectedCandidate(onSiteSchedule);
			}
		});
	};

	const handleAddInterviewer = (interviewerId: string) => {
		// Check if the interviewer is already in the list
		if (onsiteScheduleSelectedCandidate?.interviewerIds.includes(interviewerId)) {
			return;
		}
		onsiteScheduleSelectedCandidate?.interviewerIds.insertAtEnd(interviewerId);
	};

	return (
		<FluentProvider theme={webLightTheme}>
			<div className="flex flex-col h-screen w-full gap-1">
				<HeaderBar audience={props.audience} />
				<div className="flex flex-row flex-wrap w-full h-full">
					<JobsList
						jobs={props.data.root.jobsList}
						onJobClick={handleJobClick}
						selectedJob={selectedJob}
						treeRoot={props.data}
					/>
					{selectedJob && (
						<CandidatesList
							job={selectedJob}
							selectedCandidate={selectedCandidate}
							onCandidateClick={handleCandidateClick}
						/>
					)}
					{selectedCandidate && (
						<OnSitePlan
							candidate={selectedCandidate}
							onSiteSchedule={onsiteScheduleSelectedCandidate!}
							interviewerPool={props.data.root.interviewerPool}
							handleToggleInterviewerList={() => setOpenDrawer(!openDrawer)}
						/>
					)}
					{selectedCandidate && (
						<InterviewerList
							interviewers={props.data.root.interviewerPool}
							isOpen={openDrawer}
							setIsOpen={setOpenDrawer}
							handleAddInterviewer={handleAddInterviewer}
						/>
					)}
				</div>
			</div>
		</FluentProvider>
	);
}

export function JobsList(props: {
	jobs: JobsArray;
	onJobClick: (job: Job) => void;
	selectedJob?: Job;
	treeRoot: TreeView<typeof HRData>;
}): JSX.Element {
	const [jobs, setJobs] = useState(props.jobs.map((job) => job));

	useEffect(() => {
		const unsubscribe = Tree.on(props.jobs, "nodeChanged", () => {
			setJobs(props.jobs.map((job) => job));
		});
		return unsubscribe;
	});

	return (
		<div className="flex flex-col gap-1 content-center p-2 w-96 h-full border-2">
			<div className="text-lg font-extrabold text-white bg-slate-500 p-2 rounded-t-md">
				Jobs List
			</div>
			<div className="flex flex-col gap-1 content-center m-2">
				<input
					id="ai-job-creation-input"
					className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-blue-500 block w-full p-2.5"
				/>
				<button
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
					onClick={async () => {
						// const newJob = createTestJob();
						// props.jobs.insertAt(props.jobs.length, newJob);
						const inputPromptElement = document.getElementById(
							"ai-job-creation-input",
						) as HTMLInputElement;
						const inputPrompt = inputPromptElement.value;
						console.log("inputPrompt -->" + inputPrompt);

						const apiKey = process.env.AZURE_OPENAI_API_KEY;
						if (apiKey === null || apiKey === undefined) {
							throw new Error("AZURE_OPENAI_API_KEY environment variable not set");
						}

						const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
						if (endpoint === null || endpoint === undefined) {
							throw new Error("AZURE_OPENAI_ENDPOINT environment variable not set");
						}

						const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
						if (deployment === null || deployment === undefined) {
							throw new Error("AZURE_OPENAI_DEPLOYMENT environment variable not set");
						}

						const originalBranch = getBranch(props.treeRoot);
						const newBranchFork = originalBranch.branch();
						const newBranchForkView = newBranchFork.viewWith(treeConfiguration);

						const aiCollabOptions: AiCollabOptions<typeof HRData> = {
							openAI: {
								client: new AzureOpenAI({
									endpoint: endpoint,
									deployment: deployment,
									apiKey: apiKey,
									apiVersion: "2024-08-01-preview",
									dangerouslyAllowBrowser: true,
								}),
								modelName: "gpt-4o",
							},
							// planningStep: true,
							// finalReviewStep: true,
							treeView: newBranchForkView,
							treeNode: newBranchForkView.root,
							prompt: {
								systemRoleContext:
									"You are an assistant that is helping out with a recruitment tool. You help draft job roles and responsibilities. You also help with on site interview plans and schedule." +
									"Some important information about the schema that you should be aware -- Each Candidate is uniquely identified by `candidateId` field. Each Interviewer is uniquely identified by `interviewerId` field." +
									"Each Job is uniquely identified by `jobId` field. Each job has an OnSiteSchedule array which is list of scheduled onsite interviews. An OnSiteSchedule object has candidateId which indicates the candidate for onsite and interviewerIds array" +
									" indicates which interviewers are doing the interviews. These ids help identify the candidate and interviewers uniquely and help map their objects in the app.",
								userAsk: inputPrompt,
							},
							limiters: {
								maxModelCalls: 50,
							},
							dumpDebugLog: true,
						};
						console.log("sending request to llm");
						console.log(aiCollabOptions);

						try {
							const response = await aiCollab(aiCollabOptions);
							console.log("This will run if there's no error.");
							console.log("received response from llm");
							console.log(response);

							if (response.status === "success") {
								alert("AI has completed request successfully");
								originalBranch.merge(newBranchFork);
							} else {
								alert("Copilot: Something went wrong processing your request");
							}
						} catch (error) {
							console.error("Caught an error:", error);
						}
					}}
				>
					Ask AI for help!
				</button>
			</div>
			<div className="flex-grow">
				{jobs.map((job, index) => (
					<JobView
						key={index}
						job={job}
						isSelected={props.selectedJob === job}
						onClick={() => props.onJobClick(job)}
					/>
				))}
			</div>
			<div className="flex-shrink-0">
				<button
					className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded w-full"
					onClick={() => {
						const newJob = createTestJob();
						props.jobs.insertAt(props.jobs.length, newJob);
					}}
				>
					+ Add New Job Manually
				</button>
			</div>
		</div>
	);
}

export function JobView(props: {
	job: Job;
	isSelected: boolean;
	onClick: () => void;
}): JSX.Element {
	const [title, setTitle] = useState(props.job.jobTitle);
	const [description, setDescription] = useState(props.job.jobDescription);

	// Register for change events on the list when the component mounts.
	// Any time the list changes, the app will update
	useEffect(() => {
		const unsubscribe = Tree.on(props.job, "nodeChanged", () => {
			setTitle(props.job.jobTitle);
			setDescription(props.job.jobDescription);
		});
		return unsubscribe;
	}, []);

	return (
		<div
			className={`flex flex-col p-2 justify-center content-center mb-2 mt-2 cursor-pointer
				 ${props.isSelected ? "bg-blue-300" : "bg-slate-100 hover:bg-slate-200"}
			`}
			onClick={props.onClick}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="text-lg font-extrabold bg-transparent text-black"></div>
				<Button
					appearance="subtle"
					aria-label="Close"
					icon={<DismissRegular />}
					onClick={() => props.job.delete()}
				/>
			</div>

			<div className="flex flex-col gap-3 justify-center flex-wrap w-full h-full">
				<div className="flex flex-col gap-3 justify-center content-center m-2">
					<div className="mb-1">
						<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
							Title:
						</label>
						<input
							className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							value={title}
							onChange={(event) => (props.job.jobTitle = event.target.value)}
						/>
					</div>

					<div className="mb-1">
						<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
							Description:
						</label>
						<textarea
							className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							value={description}
							onChange={(event) => (props.job.jobDescription = event.target.value)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export function HeaderBar(props: { audience: IServiceAudience<IMember> }): JSX.Element {
	return (
		<div className="w-full bg-gray-800 text-white p-4 flex items-center justify-between">
			<h1 className="text-xl font-bold">HR Recruitment Management</h1>
			<CreateAvatarGroup audience={props.audience} />
		</div>
	);
}

export function CreateAvatarGroup(props: { audience: IServiceAudience<IMember> }): JSX.Element {
	const [fluidMembers, setFluidMembers] = useState<IMember[]>([]);

	const updateMembers = () => {
		if (props.audience.getMyself() == undefined) return;
		if (props.audience.getMyself()?.id == undefined) return;
		if (props.audience.getMembers() == undefined) return;

		setFluidMembers(Array.from(props.audience.getMembers().values()));
	};

	useEffect(() => {
		props.audience.on("membersChanged", updateMembers);

		return () => {
			props.audience.off("membersChanged", updateMembers);
		};
	}, []);

	const azureMembers = fluidMembers as AzureMember[];
	const odspMembers = fluidMembers as OdspMember[];

	if (azureMembers[0]?.name) {
		return AzureFacepile({ members: azureMembers });
	} else if (odspMembers[0]?.email) {
		return SpeFacepile({ members: odspMembers });
	} else {
		return <div>error</div>;
	}
}
