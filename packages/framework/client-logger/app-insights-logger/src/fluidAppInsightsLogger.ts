/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { type ApplicationInsights } from "@microsoft/applicationinsights-web";
import {
	type ITelemetryBaseEvent,
	type ITelemetryBaseLogger,
} from "@fluidframework/core-interfaces";

const LogCategory = {
	PERFORMANCE: "performance",
	GENERIC: "generic",
	ERROR: "error",
};

/**
 * The category of Fluid log.s
 */
export type LogCategory = typeof LogCategory[keyof typeof LogCategory];

/**
 * The configuration object for the {@link FluidAppInsightsLogger}
 */
export interface FluidAppInsightsLoggerConfig {
	/**
	 * Controls the default filtering of log events by their category.
	 * This can be overriden with namespace level filters
	 */
	filterMode: "inclusive" | "exclusive";
	categoryFilter: {
		category: LogCategory;
		priority: number;
	};
	namespaceFilters: {
		namespace: string;
		category?: LogCategory;
		priority: number;
		childExceptions?: {
			namespace: string;
		}[];
	}[];
}

/**
 * type 2
 */
export interface FluidAppInsightsLoggerConfigType2 {
	filterConfig: {
		/**
		 * Determines whether all logs or excluded by default
		 * and how filters are applied.
		 *
		 * "inclusive" mode means all logs and EXCLUDED
		 *  by default and filters are used to determine what is included
		 *
		 * "exclusive" mode means all logs and INCLUDED
		 *  by default and filters are used to determine what is excluded
		 */
		mode: "inclusive" | "exclusive";
		/**
		 * Controls the default filtering of log events by their category.
		 * This can be overriden with namespace level filters
		 */
		filters: {
			namespace?: string;
			category?: LogCategory;
			/**
			 * The priority in which each filter should be evaluated.
			 * A lower number means the filter will be evaluated earlier.
			 * If there are two filters with the same priority,
			 * there is no guarentee to the order in which they will be evaluated
			 */
			priority: number;
			childExceptions?: {
				namespace: string;
			}[];
		}[];
	};
}

// Scenario 1:  I want to include all of a parent category EXCEPT one or more child categories.
// 1. include latency.*
// 2. exclude latecy.op.delta
const scenarioOneLoggerConfig: FluidAppInsightsLoggerConfig = {
	filterMode: "inclusive",
	categoryFilter: {
		category: LogCategory.PERFORMANCE,
		priority: 5,
	},
	namespaceFilters: [
		{
			namespace: "latency.*",
			category: LogCategory.ERROR,
			priority: 1,
			childExceptions: [
				{
					namespace: "latency.op.delta",
				},
			],
		},
	],
};

// Scenario 2:  I want to include none of a parent categories EXCEPT for one child category
// 1. exclude latency.*
// 2. include latecy.op.delta
const scenarioTwoLoggerConfig: FluidAppInsightsLoggerConfig = {
	filterMode: "inclusive",
	categoryFilter: {
		category: LogCategory.PERFORMANCE,
		priority: 5,
	},
	namespaceFilters: [
		{
			namespace: "latency.*",
			priority: 1,
			childExceptions: [
				{
					namespace: "latency.op.delta",
				},
			],
		},
	],
};

const scenarioOneType2LoggerConfig: FluidAppInsightsLoggerConfigType2 = {
	filterConfig: {
		mode: "inclusive",
		filters: [
			{
				category: LogCategory.PERFORMANCE,
				priority: 5,
			},
			{
				namespace: "latency.*",
				priority: 1,
				childExceptions: [
					{
						namespace: "latency.op.delta",
					},
				],
			},
		],
	},
};

interface TelemetryFilter {
	namespace?: string;
	category?: LogCategory;
	/**
	 * The priority in which each filter should be evaluated.
	 * A lower number means the filter will be evaluated earlier.
	 * If there are two filters with the same priority,
	 * there is no guarentee to the order in which they will be evaluated
	 */
	priority: number;
	childExceptions?: {
		namespace: string;
	}[];
}

// Questions:
// Do log namespaces include the category as well? Or are they separate?

/**
 * An implementation of {@link @fluidframework/core-interfaces#ITelemetryBaseLogger | ITelemetryBaseLogger}
 * that routes Fluid telemetry events to Azure App Insights using the App Insights trackEvent API.
 * The provided ApplicationInsights instance MUST be initialized with client.loadAppInsights()
 * or else logging will not occur.
 * @sealed
 */
export class FluidAppInsightsLogger implements ITelemetryBaseLogger {
	/**
	 * The Azure ApplicationInsights client utilized by this logger.
	 * The ApplicationInsights instance MUST be initialized with client.loadAppInsights()
	 * or else logging will not occur.
	 */
	private readonly baseLoggingClient: ApplicationInsights;
	private readonly config: FluidAppInsightsLoggerConfigType2;
	private readonly filters: TelemetryFilter[] = [];

	public constructor(client: ApplicationInsights, config?: FluidAppInsightsLoggerConfigType2) {
		this.baseLoggingClient = client;
		if (config === undefined) {
			this.config = {
				filterConfig: {
					mode: "exclusive",
					filters: [],
				},
			};
		} else {
			this.config = config;
			this.initializeFiltersFromConfig(config);
		}
	}

	private initializeFiltersFromConfig(config: FluidAppInsightsLoggerConfigType2): void {
		for (const filter of config.filterConfig.filters) {
			try {
				this.validateConfigFilter(filter);
				this.filters.push(filter);
			} catch (error) {
				console.warn("Invalid config provided to Fluid App Insights Logger", error);
			}
		}

		// Sort filters using priority from low to high
		this.filters.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Checks if the provided config filter is valid.
	 */
	private validateConfigFilter(filter: TelemetryFilter): void {
		if (filter.category === undefined && filter.namespace === undefined) {
			throw new Error(
				"Invalid filter provided to Fluid App Insights logger with no category or namespace provided",
			);
		} else if (
			filter.namespace !== undefined &&
			filter.childExceptions &&
			filter.childExceptions.length > 0
		) {
			throw new Error(
				"Invalid filter provided to Fluid App Insights logger with no parent namespace but includes child exceptions",
			);
		}
		// Todo: Validate childException namespaces are actually childen namespaces of the parent.;
	}

	/**
	 * Routes Fluid telemetry events to the trackEvent App Insights API
	 */
	public send(event: ITelemetryBaseEvent): void {
		let shouldSendEvent = true;
		if (this.filters.length > 0 && this.doesEventMatchFilter(event)) {
			shouldSendEvent = this.config.filterConfig.mode === "inclusive" ? true : false;
		}

		if (shouldSendEvent) {
			this.baseLoggingClient.trackEvent({
				name: event.eventName,
				properties: event,
			});
		}
	}

	private doesEventMatchFilter(event: ITelemetryBaseEvent): boolean {
		for (const filter of this.filters) {
			// A namespace is defined but a category is not; if the namespace matches return true;
			// TODO: handle child exceptions and regex namespaces
			if (
				filter.category === undefined &&
				filter.namespace !== undefined &&
				filter.namespace === event.eventName
			) {
				return true;
			}
			// A category is defined with no namespace; If the event category matches return true.
			else if (
				filter.category !== undefined &&
				filter.namespace === undefined &&
				filter.category === event.category
			) {
				return true;
			}
			// A category AND namespace are defined, return true if both match.
			// TODO: handle child exceptions and regex namespaces
			else if (
				filter.category !== undefined &&
				filter.namespace !== undefined &&
				filter.category === event.category &&
				filter.namespace === event.eventName
			) {
				return true;
			}
		}
		return true;
	}
}
