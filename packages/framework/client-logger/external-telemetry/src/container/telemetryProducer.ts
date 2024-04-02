/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { type ICriticalContainerError } from "@fluidframework/container-definitions";
import {
	ContainerTelemetryEventNames,
	type ContainerTelemetryEventName,
	type IContainerTelemetry,
	type ContainerDisposedTelemetry,
	type ContainerHeartbeatTelemetry,
} from "./containerTelemetry.js";
import {
	type IFluidContainerSystemEventName,
	IFluidContainerSystemEventNames,
} from "./containerSystemEvents.js";
import { v4 as uuid } from "uuid";

/**
 * This class produces {@link IContainerTelemetry} from raw container system events {@link @fluidframework/fluid-static#IFluidContainerEvents}.
 * The class contains different helper methods for simplifying and standardizing logic for adding additional information necessary
 * to produce different {@link IContainerTelemetry}.
 *
 * @internal
 */
export class ContainerEventTelemetryProducer {
	/**
	 * Unique identifier for the instance of the container that this class is generating telemetry for.
	 */
	private readonly containerInstanceId = uuid();

	constructor(private readonly containerId: string) {}

	public produceFromSystemEvent(
		eventName: IFluidContainerSystemEventName,
		payload?: any,
	): IContainerTelemetry | undefined {
		switch (eventName) {
			case IFluidContainerSystemEventNames.CONNECTED:
				return this.produceBaseContainerTelemetry(ContainerTelemetryEventNames.CONNECTED);
			case IFluidContainerSystemEventNames.DISCONNECTED:
				return this.produceBaseContainerTelemetry(
					ContainerTelemetryEventNames.DISCONNECTED,
				);
			case IFluidContainerSystemEventNames.DISPOSED:
				return this.produceDiposedTelemetry(payload);
			default:
				break;
		}
	}

	public produceHeartbeatTelemetry = (): ContainerHeartbeatTelemetry => {
		return this.produceBaseContainerTelemetry(
			ContainerTelemetryEventNames.HEARTBEAT,
		) as ContainerHeartbeatTelemetry;
	};

	private produceBaseContainerTelemetry = (
		eventName: ContainerTelemetryEventName,
	): IContainerTelemetry => {
		return {
			eventName,
			containerId: this.containerId,
			containerInstanceId: this.containerInstanceId,
		} as IContainerTelemetry;
	};

	private produceDiposedTelemetry = (payload?: {
		error?: ICriticalContainerError;
	}): ContainerDisposedTelemetry => {
		const telemetry: ContainerDisposedTelemetry = {
			eventName: ContainerTelemetryEventNames.DISPOSED,
			containerId: this.containerId,
			containerInstanceId: this.containerInstanceId,
		};
		if (payload?.error !== undefined) {
			telemetry.error = payload.error;
		}
		return telemetry;
	};
}
