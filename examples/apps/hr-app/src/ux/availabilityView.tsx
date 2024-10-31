// Days of the week (Monday, Tuesday... Friday) as the columns, and availability as rows

import React, { useEffect, useReducer, useState } from "react";
import { Availability } from "../schema.js";
import { Tree } from "fluid-framework";

// Checkboxes are checked if a time is available, unchecked if it's not
export function AvailabilityView(props: { avail: Availability }): JSX.Element {
	const [availability, setAvailability] = useState<string[]>(props.avail.map((item) => item));
	const [, forceUpdate] = useReducer((x) => x + 1, 0);

	// Register for change events on the list when the component mounts.
	// Any time the list changes, the app will update
	useEffect(() => {
		const unsubscribe = Tree.on(props.avail, "treeChanged", () => {
			const availableDays: string[] = [];
			props.avail.map((item) => {
				availableDays.push(item);
			});
			setAvailability(availableDays);

			// TODO: Is this the right paradigm for force updating the UI?
			forceUpdate();
		});
		return unsubscribe;
	}, []);

	const handleAvailabilityChange = (checked: boolean, dayName: string) => {
		if (checked && !props.avail.includes(dayName)) {
			props.avail.insertAtStart(dayName);
		} else {
			const index = props.avail.indexOf(dayName);
			props.avail.removeAt(index);
		}
	};

	return (
		<div className="flex flex-col gap-1 justify-center content-center m-1">
			<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
				Availability:
			</label>
			<div className="flex flex-row gap-2">
				<DayView
					dayName="Mon"
					isAvailable={availability.includes("Monday")}
					onChange={(checked: boolean) => handleAvailabilityChange(checked, "Monday")}
				/>
				<DayView
					dayName="Tue"
					isAvailable={availability.includes("Tuesday")}
					onChange={(checked: boolean) => handleAvailabilityChange(checked, "Tuesday")}
				/>
				<DayView
					dayName="Wed"
					isAvailable={availability.includes("Wednesday")}
					onChange={(checked: boolean) => handleAvailabilityChange(checked, "Wednesday")}
				/>
				<DayView
					dayName="Thu"
					isAvailable={availability.includes("Thursday")}
					onChange={(checked: boolean) => handleAvailabilityChange(checked, "Thursday")}
				/>
				<DayView
					dayName="Fri"
					isAvailable={availability.includes("Friday")}
					onChange={(checked: boolean) => handleAvailabilityChange(checked, "Friday")}
				/>
			</div>
		</div>
	);
}

export function DayView(props: {
	dayName: string;
	isAvailable: boolean;
	onChange: (checked: boolean) => void;
}): JSX.Element {
	return (
		<div className="flex flex-col gap-1 items-center justify-center">
			<label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
				{props.dayName}
			</label>
			<input
				type="checkbox"
				checked={props.isAvailable}
				onChange={(event) => props.onChange(event.target.checked)}
			/>
		</div>
	);
}
