import {
	DrawerBody,
	DrawerHeader,
	DrawerHeaderTitle,
	InlineDrawer,
	Button,
	useRestoreFocusSource,
	useRestoreFocusTarget,
} from "@fluentui/react-components";
import { Tree, TreeArrayNode } from "fluid-framework";
import { Interviewer } from "../schema.js";
import React, { useEffect, useState } from "react";
import { AddFilled, DismissRegular } from "@fluentui/react-icons";
import { AvailabilityView } from "./availabilityView.js";

export function InterviewerList(props: {
	interviewers: TreeArrayNode<typeof Interviewer>;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	handleAddInterviewer: (interviewerId: string) => void;
}): JSX.Element {
	const restoreFocusTargetAttributes = useRestoreFocusTarget();
	const restoreFocusSourceAttributes = useRestoreFocusSource();

	return (
		<InlineDrawer
			{...restoreFocusSourceAttributes}
			separator
			open={props.isOpen}
			position="end"
		>
			<DrawerHeader>
				<DrawerHeaderTitle
					action={
						<Button
							{...restoreFocusTargetAttributes}
							appearance="subtle"
							aria-label="Close"
							icon={<DismissRegular />}
							onClick={() => props.setIsOpen(false)}
						/>
					}
				>
					<div className="text-lg font-extrabold bg-transparent text-black">
						Interviewer Pool
					</div>
				</DrawerHeaderTitle>
			</DrawerHeader>

			<DrawerBody>
				{props.interviewers.map((interviewer, index) => (
					<InterviewerView
						key={index}
						interviewer={interviewer}
						handleAddInterviewer={props.handleAddInterviewer}
					/>
				))}
			</DrawerBody>
		</InlineDrawer>
	);
}

export function InterviewerView(props: {
	interviewer: Interviewer;
	handleAddInterviewer: (interviewerId: string) => void;
}): JSX.Element {
	const [name, setName] = useState(props.interviewer.name);
	const [role, setRole] = useState(props.interviewer.role);

	// Register for change events on the list when the component mounts.
	// Any time the list changes, the app will update
	useEffect(() => {
		const unsubscribe = Tree.on(props.interviewer, "nodeChanged", () => {
			setName(props.interviewer.name);
			setRole(props.interviewer.role);
		});
		return unsubscribe;
	}, []);

	return (
		<div className="flex flex-col gap-1 justify-center content-center m-2 border border-gray-300 p-2 rounded">
			<Button
				appearance="subtle"
				aria-label="Add"
				icon={<AddFilled />}
				onClick={() => props.handleAddInterviewer(props.interviewer.interviewerId)}
			/>
			<div className="mb-1">
				<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
					Interviewer Name:
				</label>
				<input
					className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					value={name}
					onChange={(event) => (props.interviewer.name = event.target.value)}
				/>
			</div>
			<div className="mb-1">
				<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
					Interviewer Role:
				</label>
				<input
					className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					value={role}
					onChange={(event) => (props.interviewer.role = event.target.value)}
				/>
			</div>
			<AvailabilityView avail={props.interviewer.availability} />
		</div>
	);
}
