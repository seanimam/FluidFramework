/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	IContainer,
	IContainerEvents,
	type ICriticalContainerError,
} from "@fluidframework/container-definitions";
import {
	ContainerConnectedTelemetry,
	ContainerTelemetryEventNames,
	IContainerTelemetry,
	ContainerClosedTelemetry,
	type ContainerTelemetryEventName,
} from "./containerTelemetry.js";
import { ContainerSystemEventName, ContainerSystemEventNames } from "./containerSystemEvents.js";

/**
 * This class produces {@link IContainerTelemetry} from raw container system events {@link IContainerEvents}.
 * The class contains different helper methods for simplifying and standardizing logic for adding additional information necessary
 * to produce different {@link IContainerTelemetry}.
 *
 * @internal
 */
export class ContainerEventTelemetryProducer {
	constructor(private container: IContainer) {}

	public produceTelemetry(
		eventName: ContainerSystemEventName,
		payload?: any,
	): IContainerTelemetry | undefined {
		let telemetry: IContainerTelemetry | undefined = undefined;
		switch (eventName) {
			case ContainerSystemEventNames.CONNECTED:
				telemetry = this.produceConnectedTelemetry(payload);
				return telemetry;
			case ContainerSystemEventNames.DISCONNECTED:
				telemetry = this.produceBasicContainerTelemetry(
					ContainerTelemetryEventNames.DISCONNECTED,
				);
				break;
			case ContainerSystemEventNames.CLOSED:
				telemetry = this.produceClosedTelemetry(payload);
				break;
			case ContainerSystemEventNames.ATTACHED:
				telemetry = this.produceBasicContainerTelemetry(
					ContainerTelemetryEventNames.ATTACHED,
				);
				break;
			case ContainerSystemEventNames.ATTACHING:
				telemetry = this.produceBasicContainerTelemetry(
					ContainerTelemetryEventNames.ATTACHING,
				);
				break;
			default:
				break;
		}
		return telemetry;
	}

	private produceBasicContainerTelemetry = <IContainerTelemetry>(
		eventName: ContainerTelemetryEventName,
	): IContainerTelemetry => {
		return {
			eventName,
			containerId: this.getContainerId(),
			documentId: this.getDocumentId(),
		} as IContainerTelemetry;
	};

	private produceConnectedTelemetry = (payload?: {
		clientId: string;
	}): ContainerConnectedTelemetry => {
		return {
			eventName: ContainerTelemetryEventNames.CONNECTED,
			containerId: payload?.clientId ?? this.getContainerId(),
			documentId: this.getDocumentId(),
		};
	};

	private produceClosedTelemetry = (payload?: {
		error?: ICriticalContainerError;
	}): ContainerClosedTelemetry => {
		const telemetry: ContainerClosedTelemetry = {
			eventName: ContainerTelemetryEventNames.CLOSED,
			containerId: this.getContainerId(),
			documentId: this.getDocumentId(),
		};
		if (payload?.error !== undefined) {
			telemetry.error = payload.error;
		}
		return telemetry;
	};

	private getContainerId(): string | undefined {
		return this.container.clientId;
	}

	private getDocumentId(): string | undefined {
		return this.container.resolvedUrl?.id;
	}
}
