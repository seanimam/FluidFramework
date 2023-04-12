/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import {
	Dropdown,
	IDropdownOption,
	IDropdownStyles,
	IStackTokens,
	Stack,
	StackItem,
} from "@fluentui/react";
import React from "react";

import {
	GetTelemetryHistory,
	handleIncomingMessage,
	InboundHandlers,
	ISourcedDebuggerMessage,
	ITimestampedTelemetryEvent,
	TelemetryHistory,
	TelemetryEvent,
} from "@fluid-tools/client-debugger";
import { useMessageRelay } from "../MessageRelayContext";
import { Waiting } from "./Waiting";

function mapEventCategoryToBackgroundColor(eventCategory: string): string {
	switch (eventCategory) {
		case "generic":
			return "#b8ebf2";
		case "performance":
			return "#4cf5a3";
		case "error":
			return "#f54c4f";
		default:
			return "#d2d3d4";
	}
}

/**
 * Function to transform the results when JSON-serializing telemetry events for display.
 * We already extract some of their properties to a different place in the UI, so it seems best to remove them from the
 * rendered JSON payload for a bit less bloat there.
 * @param key - The name of the property that's being serialized.
 * @param value - The value of the property that's being serialized.
 * @returns An updated value for the given key, or 'undefined' to remove the key from the serialized output.
 */
function jsonSerializationTransformer(key, value): unknown {
	// Filter out properties we display somewhere else in the UI
	if (key === "eventName" || key === "category") {
		return undefined;
	}
	return value;
}

/**
 * Set the default dislayed size to 100.
 */
const DEFAULT_PAGE_SIZE = 100;

/**
 * Displays telemetry events generated by FluidFramework in the application.
 */
export function TelemetryView(): React.ReactElement {
	const messageRelay = useMessageRelay();

	const [telemetryEvents, setTelemetryEvents] = React.useState<
		ITimestampedTelemetryEvent[] | undefined
	>();
	const [maxEventsToDisplay, setMaxEventsToDisplay] = React.useState<number>(DEFAULT_PAGE_SIZE);

	React.useEffect(() => {
		/**
		 * Handlers for inbound messages related to telemetry.
		 */
		const inboundMessageHandlers: InboundHandlers = {
			[TelemetryEvent.MessageType]: (untypedMessage) => {
				const message = untypedMessage as TelemetryEvent.Message;
				setTelemetryEvents((currentEvents) => [
					message.data.event,
					...(currentEvents ?? []),
				]);
				return true;
			},
			[TelemetryHistory.MessageType]: (untypedMessage) => {
				const message = untypedMessage as TelemetryHistory.Message;
				setTelemetryEvents(message.data.contents);
				return true;
			},
		};

		// Event handler for messages coming from the Message Relay
		function messageHandler(message: Partial<ISourcedDebuggerMessage>): void {
			handleIncomingMessage(message, inboundMessageHandlers);
		}

		messageRelay.on("message", messageHandler);

		// Request all log history
		messageRelay.postMessage(GetTelemetryHistory.createMessage());

		return (): void => {
			messageRelay.off("message", messageHandler);
		};
	}, [messageRelay, setTelemetryEvents]);

	const log_view =
		telemetryEvents !== undefined ? (
			<>
				<h3>Telemetry events (newest first):</h3>
				<ul>
					{telemetryEvents.slice(0, maxEventsToDisplay).map((message, index) => (
						<div
							key={index}
							style={{
								border: "1px solid black",
								backgroundColor: mapEventCategoryToBackgroundColor(
									message.logContent.category,
								),
								padding: "5px",
							}}
						>
							<h4 style={{ margin: "0px" }}>
								EventName: {message.logContent.eventName}
								<br />
								Category: {message.logContent.category}
								<br />
								ContainerId: {message.logContent.containerId} (
								{message.logContent.clientType})
								<br />
								DocumentId: {message.logContent.docId}
								<br />
								Timestamp: {new Date(message.timestamp).toLocaleString()}
								<br />
							</h4>
							<p>
								{JSON.stringify(
									message.logContent,
									jsonSerializationTransformer,
									"  ",
								)}
							</p>
						</div>
					))}
				</ul>
			</>
		) : (
			<Waiting label={"Waiting for Telemetry events"} />
		);

	return (
		<Stack>
			<StackItem>
				<_ListLengthSelection
					currentLimit={maxEventsToDisplay}
					onChangeSelection={(key): void => setMaxEventsToDisplay(key)}
				/>
			</StackItem>
			<StackItem>{log_view}</StackItem>
		</Stack>
	);
}

/**
 * {@link _ListLengthSelectionProps} input props.
 */
interface _ListLengthSelectionProps {
	/**
	 * The current limit (max number of telemetry events to show).
	 * @defaultValue {@link DEFAULT_PAGE_SIZE}
	 */
	currentLimit: number;

	/**
	 * Called when the selection changes.
	 */
	onChangeSelection(newLimit: number): void;
}

/**
 * A dropdown menu for selecting how many logs to display on the page.
 */
function _ListLengthSelection(props: _ListLengthSelectionProps): React.ReactElement {
	const { currentLimit, onChangeSelection } = props;
	const dropdownStyles: Partial<IDropdownStyles> = {
		dropdown: { width: "300px", zIndex: "1" },
	};

	const stackTokens: IStackTokens = { childrenGap: 20 };

	// Options formatted for the Fluent Dropdown component
	const dropdownOptions: IDropdownOption[] = [
		{ key: 50, text: "50" },
		{ key: 100, text: "100" },
		{ key: 500, text: "500" },
		{ key: 1000, text: "1000" },
	];

	return (
		<Stack tokens={stackTokens}>
			<div className="list-size-options">
				<h3>Max number of telemetry events to display: </h3>
				<Dropdown
					placeholder="Select an option"
					selectedKey={currentLimit}
					options={dropdownOptions}
					styles={dropdownStyles}
					// change the number of logs displayed on the page
					onChange={(event, option): void => onChangeSelection(option?.key as number)}
				/>
			</div>
		</Stack>
	);
}
