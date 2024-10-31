import { Tree, TreeArrayNode } from "fluid-framework";
import { Candidate, Interviewer, OnSiteSchedule } from "../schema.js";
import { useEffect, useState } from "react";
import { Button } from "@fluentui/react-components";
import React from "react";
import { AvailabilityView } from "./availabilityView.js";
import { AddCircleFilled, DeleteFilled } from "@fluentui/react-icons";

export function OnSitePlan(props: {
	candidate: Candidate;
	onSiteSchedule: OnSiteSchedule;
	interviewerPool: TreeArrayNode<typeof Interviewer>;
	handleToggleInterviewerList: () => void;
}): JSX.Element {
	const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
	const [onSiteDay, setOnSiteDay] = useState(props.onSiteSchedule.day);
	const [onSiteInterviewers, setOnSiteInterviewers] = useState<Interviewer[]>(
		props.onSiteSchedule.interviewerIds
			.map((intId) =>
				props.interviewerPool.find((interviewer) => interviewer.interviewerId === intId),
			)
			.filter((interviewer): interviewer is Interviewer => interviewer !== undefined),
	);
	const checkValidity = () => {
		// Check if there are exactly 3 interviewers and if all are available on the on site day
		if (onSiteInterviewers.length !== 3 || !props.candidate.availability.includes(onSiteDay)) {
			return false;
		}

		for (const interviewer of onSiteInterviewers) {
			if (!interviewer.availability.includes(onSiteDay)) {
				return false;
			}
		}

		return true;
	};
	const [isValid, setIsValid] = useState(checkValidity());

	const handleRemoveInterviewer = (interviewerId: string) => {
		const index = props.onSiteSchedule.interviewerIds.indexOf(interviewerId);
		props.onSiteSchedule.interviewerIds.removeAt(index);
	};

	useEffect(() => {
		const unsubscribe = Tree.on(props.candidate, "treeChanged", () => {
			setOnSiteDay(props.onSiteSchedule.day);
			setOnSiteInterviewers(
				props.onSiteSchedule.interviewerIds
					.map((intId) =>
						props.interviewerPool.find(
							(interviewer) => interviewer.interviewerId === intId,
						),
					)
					.filter((interviewer): interviewer is Interviewer => interviewer !== undefined),
			);
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		setIsValid(checkValidity());
	}, [onSiteDay, onSiteInterviewers]);

	return (
		<div
			className={`flex flex-col gap-1 content-center m-2 w-96 h-full overflow-y-auto ${
				isValid ? "bg-green-100" : "bg-red-100"
			}`}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="text-lg font-extrabold bg-transparent text-black">On Site Plan</div>
				<Button
					appearance="subtle"
					aria-label="Add Interviewer"
					icon={<AddCircleFilled />}
					onClick={() => props.handleToggleInterviewerList()}
				/>
			</div>
			<select
				className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				value={onSiteDay}
				onChange={(event) => (props.onSiteSchedule.day = event.target.value)}
			>
				{daysOfWeek.map((day) => (
					<option key={day} value={day}>
						{day}
					</option>
				))}
			</select>
			<div className="flex flex-col gap-1 content-center m-2">
				{onSiteInterviewers.map((interviewer) => (
					<InterviewerReadView
						key={interviewer.interviewerId}
						interviewer={interviewer}
						removeHandler={handleRemoveInterviewer}
						interviewerChanged={() => setIsValid(checkValidity())}
					/>
				))}
			</div>
		</div>
	);
}

export function InterviewerReadView(props: {
	interviewer: Interviewer;
	removeHandler: (interviewerId: string) => void;
	interviewerChanged: () => void;
}): JSX.Element {
	const [name, setName] = useState(props.interviewer.name);
	const [role, setRole] = useState(props.interviewer.role);

	// Register for change events on the list when the component mounts.
	// Any time the list changes, the app will update
	useEffect(() => {
		const unsubscribe = Tree.on(props.interviewer, "treeChanged", () => {
			setName(props.interviewer.name);
			setRole(props.interviewer.role);
			props.interviewerChanged();
		});
		return unsubscribe;
	}, []);

	return (
		<div className="relative flex flex-col gap-1 justify-center content-center m-2 border border-gray-300 p-2 rounded">
			<Button
				appearance="subtle"
				aria-label="Remove Interviewer"
				icon={<DeleteFilled />}
				onClick={() => props.removeHandler(props.interviewer.interviewerId)}
			/>
			<div className="mb-1">Interviewer Name: {name}</div>
			<div className="mb-1">Interviewer Role: {role}</div>
			<AvailabilityView avail={props.interviewer.availability} />
		</div>
	);
}
