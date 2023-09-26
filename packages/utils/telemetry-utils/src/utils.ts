/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import {
	ITelemetryBaseEvent,
	ITelemetryBaseLogger,
	ITelemetryGenericEvent,
} from "@fluidframework/core-interfaces";
import { loggerToMonitoringContext } from "./config";
import { ITelemetryGenericEventExt, ITelemetryLoggerExt } from "./telemetryTypes";

/**
 * Like assert, but logs only if the condition is false, rather than throwing
 * @param condition - The condition to attest too
 * @param logger - The logger to log with
 * @param event - The string or event to log
 * @returns The outcome of the condition
 */
export function logIfFalse(
	condition: unknown,
	logger: ITelemetryBaseLogger,
	event: string | ITelemetryGenericEvent,
): condition is true {
	if (condition) {
		return true;
	}
	const newEvent: ITelemetryBaseEvent =
		typeof event === "string"
			? { eventName: event, category: "error" }
			: { category: "error", ...event };
	logger.send(newEvent);
	return false;
}

/**
 * Used in conjunction with the {@link createSampledLogger} to control logic for sampling events.
 *
 * @internal
 */
export interface IEventSampler<> {
	/**
	 * @returns true if the event should be sampled or false if not
	 */
	sample?: () => boolean | undefined;
}

/**
 * A telemetry logger that has sampling capabilities
 *
 * @internal
 */
export interface ISampledTelemetryLogger extends ITelemetryLoggerExt {
	isSamplingDisabled: boolean;
	eventSampler?: IEventSampler;
}

/**
 * Wraps around an existing logger matching the {@link ITelemetryLoggerExt} interface and provides the ability to only log a subset of events using a sampling strategy.
 * The sampling functionality uses the Fluid telemetry logging configuration along with the optionally provided event sampling callback to determine whether an event should
 * be logged or not.
 *
 * Configuration object parameters:
 * 'Fluid.Telemetry.DisableSampling': if this config value is set to true, all events will be unsampled and therefore logged.
 * Otherwise only a sample will be logged according to the provided event sampler callback.
 *
 * @internal
 */
export function createSampledLogger(
	logger: ITelemetryLoggerExt,
	eventSampler?: IEventSampler,
): ISampledTelemetryLogger {
	const monitoringContext = loggerToMonitoringContext(logger);
	const isSamplingDisabled = monitoringContext.config.getBoolean(
		"Fluid.Telemetry.DisableSampling",
	);

	const sampledLogger = {
		send: (event: ITelemetryBaseEvent) => {
			// if sampling is disabled, log all events. Otherwise, use the eventSampler to determine if the event should be logged.
			if (
				isSamplingDisabled ||
				(!isSamplingDisabled && eventSampler?.sample !== undefined && eventSampler.sample())
			) {
				logger.send(event);
			}
		},
		sendTelemetryEvent: (event: ITelemetryGenericEventExt) => {
			if (
				isSamplingDisabled ||
				(!isSamplingDisabled && eventSampler?.sample !== undefined && eventSampler.sample())
			) {
				logger.sendTelemetryEvent(event);
			}
		},
		sendErrorEvent: (event: ITelemetryGenericEventExt) => {
			if (
				isSamplingDisabled ||
				(!isSamplingDisabled && eventSampler?.sample !== undefined && eventSampler.sample())
			) {
				logger.sendErrorEvent(event);
			}
		},
		sendPerformanceEvent: (event: ITelemetryGenericEventExt) => {
			if (
				isSamplingDisabled ||
				(!isSamplingDisabled && eventSampler?.sample !== undefined && eventSampler.sample())
			) {
				logger.sendPerformanceEvent(event);
			}
		},
		eventSampler,
		isSamplingDisabled: isSamplingDisabled === true,
	};

	return sampledLogger;
}
