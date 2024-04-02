/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { type ICriticalContainerError } from "@fluidframework/container-definitions";
import { IContainerTelemetry } from "./containerTelemetry.js";
import { ContainerEventTelemetryProducer } from "./telemetryProducer.js";
import { ITelemetryConsumer } from "../common/index.js";
import {
	IFluidContainerSystemEventName,
	IFluidContainerSystemEventNames,
} from "./containerSystemEvents.js";
import type { IFluidContainer } from "@fluidframework/fluid-static";
/**
 * This class manages container telemetry intended for customers to consume.
 * It manages subcribing to the proper raw container system events, sending them to the {@link ContainerEventTelemetryProducer}
 * to be transformed into {@link IContainerTelemetry} and finally sending them to the provided {@link ITelemetryConsumer}
 *
 * @internal
 */
export class ContainerTelemetryManager {
	constructor(
		private readonly container: IFluidContainer,
		private readonly telemetryProducer: ContainerEventTelemetryProducer,
		private readonly telemetryConsumers: ITelemetryConsumer[],
	) {
		this.setupEventHandlers();
	}

	/**
	 * Subscribes to the raw container system events and routes them to telemetry producers.
	 */
	private setupEventHandlers() {
		this.container.on(IFluidContainerSystemEventNames.CONNECTED, () =>
			this.handleContainerSystemEvent(IFluidContainerSystemEventNames.CONNECTED),
		);
		this.container.on(IFluidContainerSystemEventNames.DISCONNECTED, () =>
			this.handleContainerSystemEvent(IFluidContainerSystemEventNames.DISCONNECTED),
		);
		this.container.on(IFluidContainerSystemEventNames.DIRTY, () =>
			this.handleContainerSystemEvent(IFluidContainerSystemEventNames.DIRTY),
		);
		this.container.on(IFluidContainerSystemEventNames.SAVED, () =>
			this.handleContainerSystemEvent(IFluidContainerSystemEventNames.SAVED),
		);
		this.container.on(
			IFluidContainerSystemEventNames.DISPOSED,
			(error?: ICriticalContainerError) =>
				this.handleContainerSystemEvent(IFluidContainerSystemEventNames.DISPOSED, {
					error,
				}),
		);
	}

	/**
	 * Handles the incoming raw container sysytem event, sending it to the {@link ContainerEventTelemetryProducer} to
	 * produce {@link IContainerTelemetry} and sending it to the {@link ITelemetryConsumer} to be consumed.
	 */
	private handleContainerSystemEvent(
		eventName: IFluidContainerSystemEventName,
		payload?: unknown,
	) {
		const telemetry: IContainerTelemetry | undefined = this.telemetryProducer.produceTelemetry(
			eventName,
			payload,
		);

		if (telemetry !== undefined) {
			this.telemetryConsumers.forEach((consumer) => consumer.consume(telemetry));
		}
	}
}
