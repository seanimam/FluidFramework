/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "assert";
import * as path from "path";

import {
	AcceptanceCondition,
	AsyncGenerator,
	AsyncReducer,
	combineReducersAsync,
	createWeightedAsyncGenerator,
} from "@fluid-private/stochastic-test-utils";
import {
	DDSFuzzModel,
	DDSFuzzSuiteOptions,
	DDSFuzzTestState,
} from "@fluid-private/test-dds-utils";
import {
	IChannelAttributes,
	IFluidDataStoreRuntime,
	type Serializable,
	IChannelServices,
} from "@fluidframework/datastore-definitions/internal";
import { PropertySet } from "@fluidframework/merge-tree/internal";

import type { SequenceInterval, SharedStringClass } from "../../index.js";
import { type IIntervalCollection, Side } from "../../intervalCollection.js";
import { SharedStringRevertible, revertSharedStringRevertibles } from "../../revertibles.js";
import { SharedStringFactory } from "../../sequenceFactory.js";
import { ISharedString } from "../../sharedString.js";
import { _dirname } from "../dirname.cjs";
import { assertEquivalentSharedStrings } from "../intervalTestUtils.js";

export type RevertibleSharedString = ISharedString & {
	revertibles: SharedStringRevertible[];
	// This field prevents change events that are emitted while in the process of a revert from
	// being added into the revertibles stack.
	isCurrentRevert: boolean;
};
export function isRevertibleSharedString(s: ISharedString): s is RevertibleSharedString {
	return (s as RevertibleSharedString).revertibles !== undefined;
}

export interface RangeSpec {
	start: number;
	end: number;
}

export interface IntervalCollectionSpec {
	collectionName: string;
}

export interface AddText {
	type: "addText";
	index: number;
	content: string;
}

export interface RemoveRange extends RangeSpec {
	type: "removeRange";
}

export interface AnnotateRange extends RangeSpec {
	type: "annotateRange";
	props: { key: string; value?: Serializable<any> }[];
}

export interface ObliterateRange extends RangeSpec {
	type: "obliterateRange";
}

// For non-interval collection fuzzing, annotating text would also be useful.
export interface AddInterval extends IntervalCollectionSpec, RangeSpec {
	type: "addInterval";
	// Normally interval ids get autogenerated, but including it here allows tracking
	// what happened to an interval over the course of its lifetime based on the history
	// file, which is useful for debugging test failures.
	id: string;
	startSide: Side;
	endSide: Side;
}

export interface ChangeInterval extends IntervalCollectionSpec {
	type: "changeInterval";
	start: number | undefined;
	end: number | undefined;
	id: string;
	startSide: Side;
	endSide: Side;
	properties: PropertySet | undefined;
}

export interface DeleteInterval extends IntervalCollectionSpec {
	type: "deleteInterval";
	id: string;
}

export interface RevertSharedStringRevertibles {
	type: "revertSharedStringRevertibles";
	editsToRevert: number;
}

export interface RevertibleWeights {
	revertWeight: number;
	addText: number;
	removeRange: number;
	obliterateRange: number;
	addInterval: number;
	deleteInterval: number;
	changeInterval: number;
}

export type IntervalOperation = AddInterval | ChangeInterval | DeleteInterval;
export type OperationWithRevert = IntervalOperation | RevertSharedStringRevertibles;
export type TextOperation = AddText | RemoveRange | AnnotateRange | ObliterateRange;

export type ClientOperation = IntervalOperation | TextOperation;

export type RevertOperation = OperationWithRevert | TextOperation;
export type Operation = RevertOperation;

export type FuzzTestState = DDSFuzzTestState<SharedStringFactory>;

export interface SharedStringOperationGenerationConfig {
	/**
	 * Maximum length of the SharedString (locally) before no further AddText operations are generated.
	 * Note due to concurrency, during test execution the actual length of the string may exceed this.
	 */
	maxStringLength?: number;
	maxInsertLength?: number;
	weights?: {
		addText: number;
		removeRange: number;
		annotateRange: number;
		obliterateRange: number;
	};
	propertyNamePool?: string[];
}

export interface IntervalOperationGenerationConfig
	extends SharedStringOperationGenerationConfig {
	/**
	 * Maximum number of intervals (locally) before no further AddInterval operations are generated.
	 * Note due to concurrency, during test execution the actual number of intervals may exceed this.
	 */
	maxIntervals?: number;
	intervalCollectionNamePool?: string[];
	propertyNamePool?: string[];
	validateInterval?: number;
	weights?: RevertibleWeights & SharedStringOperationGenerationConfig["weights"];
}

export const defaultSharedStringOperationGenerationConfig: Required<SharedStringOperationGenerationConfig> =
	{
		maxStringLength: 1000,
		maxInsertLength: 10,
		weights: {
			addText: 2,
			removeRange: 1,
			annotateRange: 1,
			obliterateRange: 1,
		},
		propertyNamePool: ["prop1", "prop2", "prop3"],
	};
export const defaultIntervalOperationGenerationConfig: Required<IntervalOperationGenerationConfig> =
	{
		...defaultSharedStringOperationGenerationConfig,
		maxIntervals: 100,
		intervalCollectionNamePool: ["comments"],
		validateInterval: 100,
		weights: {
			...defaultSharedStringOperationGenerationConfig.weights,
			revertWeight: 2,
			addInterval: 2,
			deleteInterval: 2,
			changeInterval: 2,
			obliterateRange: 0,
		},
	};

export interface LoggingInfo {
	/** id of the interval to track over time */
	intervalId: string;
	/** Clients to print */
	clientIds: string[];
}

function logCurrentState(state: FuzzTestState, loggingInfo: LoggingInfo): void {
	for (const id of loggingInfo.clientIds) {
		const { channel } = state.clients.find((s) => s.containerRuntime.clientId === id) ?? {};
		assert(channel);
		const labels = channel.getIntervalCollectionLabels();
		const interval = Array.from(labels)
			.map((label) =>
				channel.getIntervalCollection(label).getIntervalById(loggingInfo.intervalId),
			)
			.find((result) => result !== undefined);

		console.log(`Client ${id}:`);
		if (interval !== undefined) {
			const start = channel.localReferencePositionToPosition(interval.start);
			const end = channel.localReferencePositionToPosition(interval.end);
			if (end === start) {
				console.log(`${" ".repeat(start)}x`);
			} else {
				console.log(`${" ".repeat(start)}[${" ".repeat(end - start - 1)}]`);
			}
		}
		console.log(channel.getText());
		console.log("\n");
	}
}

type ClientOpState = FuzzTestState;

export function makeReducer(
	loggingInfo?: LoggingInfo,
): AsyncReducer<Operation | RevertOperation, ClientOpState> {
	const withLogging =
		<T>(baseReducer: AsyncReducer<T, ClientOpState>): AsyncReducer<T, ClientOpState> =>
		async (state, operation) => {
			if (loggingInfo !== undefined) {
				logCurrentState(state, loggingInfo);
				console.log("-".repeat(20));
				console.log("Next operation:", JSON.stringify(operation, undefined, 4));
			}
			await baseReducer(state, operation);
		};

	const reducer = combineReducersAsync<Operation | RevertOperation, ClientOpState>({
		addText: async ({ client }, { index, content }) => {
			client.channel.insertText(index, content);
		},
		removeRange: async ({ client }, { start, end }) => {
			client.channel.removeRange(start, end);
		},
		annotateRange: async ({ client }, { start, end, props }) => {
			const propertySet: PropertySet = {};
			for (const { key, value } of props) {
				propertySet[key] = value;
			}
			client.channel.annotateRange(start, end, propertySet);
		},
		obliterateRange: async ({ client }, { start, end }) => {
			client.channel.obliterateRange(start, end);
		},
		addInterval: async (
			{ client },
			{ start, end, collectionName, id, startSide, endSide },
		) => {
			const collection = client.channel.getIntervalCollection(collectionName);
			collection.add({
				start: { pos: start, side: startSide },
				end: { pos: end, side: endSide },
				props: { intervalId: id },
			});
		},
		deleteInterval: async ({ client }, { id, collectionName }) => {
			const collection = client.channel.getIntervalCollection(collectionName);
			collection.removeIntervalById(id);
		},
		changeInterval: async (
			{ client },
			{ id, start, end, collectionName, startSide, endSide, properties },
		) => {
			const collection = client.channel.getIntervalCollection(collectionName);
			if (start !== undefined && end !== undefined) {
				collection.change(id, {
					start: { pos: start, side: startSide },
					end: { pos: end, side: endSide },
					props: properties,
				});
			} else {
				collection.change(id, { props: properties });
			}
		},
		revertSharedStringRevertibles: async ({ client }, { editsToRevert }) => {
			assert(isRevertibleSharedString(client.channel));
			client.channel.isCurrentRevert = true;
			const few = client.channel.revertibles.splice(-editsToRevert, editsToRevert);
			revertSharedStringRevertibles(client.channel, few);
			client.channel.isCurrentRevert = false;
		},
	});

	return withLogging(reducer);
}

export function createSharedStringGeneratorOperations(
	optionsParam?: SharedStringOperationGenerationConfig,
) {
	const options = { ...defaultSharedStringOperationGenerationConfig, ...(optionsParam ?? {}) };

	// All subsequent helper functions are generators; note that they don't actually apply any operations.
	function startPosition({ random, client }: ClientOpState): number {
		return random.integer(0, Math.max(0, client.channel.getLength() - 1));
	}

	function exclusiveRange(state: ClientOpState): RangeSpec {
		const start = startPosition(state);
		const end = state.random.integer(start + 1, state.client.channel.getLength());
		return { start, end };
	}

	function exclusiveRangeLeaveChar(state: ClientOpState): RangeSpec {
		const start = state.random.integer(0, state.client.channel.getLength() - 2);
		const end = state.random.integer(start + 1, state.client.channel.getLength() - 1);
		return { start, end };
	}

	async function addText(state: ClientOpState): Promise<AddText> {
		const { random, client } = state;
		return {
			type: "addText",
			index: random.integer(0, client.channel.getLength()),
			content: random.string(random.integer(1, options.maxInsertLength)),
		};
	}

	async function obliterateRange(state: ClientOpState): Promise<ObliterateRange> {
		return {
			type: "obliterateRange",
			...exclusiveRange(state),
		};
	}

	async function annotateRange(state: ClientOpState): Promise<AnnotateRange> {
		const { random } = state;
		const key = random.pick(options.propertyNamePool);
		const value = random.pick([random.string(5), random.handle(), undefined, null]);
		return {
			type: "annotateRange",
			...exclusiveRange(state),
			props: [{ key, value }],
		};
	}

	async function removeRange(state: ClientOpState): Promise<RemoveRange> {
		return { type: "removeRange", ...exclusiveRange(state) };
	}

	async function removeRangeLeaveChar(state: ClientOpState): Promise<RemoveRange> {
		return { type: "removeRange", ...exclusiveRangeLeaveChar(state) };
	}

	const lengthSatisfies =
		(criteria: (length: number) => boolean): AcceptanceCondition<ClientOpState> =>
		({ client }) =>
			criteria(client.channel.getLength());
	const hasNonzeroLength = lengthSatisfies((length) => length > 0);
	const isShorterThanMaxLength = lengthSatisfies((length) => length < options.maxStringLength);

	return {
		startPosition,
		exclusiveRange,
		exclusiveRangeLeaveChar,
		addText,
		obliterateRange,
		annotateRange,
		removeRange,
		removeRangeLeaveChar,
		lengthSatisfies,
		hasNonzeroLength,
		isShorterThanMaxLength,
	};
}

export class SharedStringFuzzFactory extends SharedStringFactory {
	public async load(
		runtime: IFluidDataStoreRuntime,
		id: string,
		services: IChannelServices,
		attributes: IChannelAttributes,
	): Promise<SharedStringClass> {
		runtime.options.intervalStickinessEnabled = true;
		runtime.options.mergeTreeEnableObliterate = true;
		return super.load(runtime, id, services, attributes);
	}

	public create(document: IFluidDataStoreRuntime, id: string): SharedStringClass {
		document.options.intervalStickinessEnabled = true;
		document.options.mergeTreeEnableObliterate = true;
		return super.create(document, id);
	}
}

export const baseModel: Omit<
	DDSFuzzModel<SharedStringFactory, Operation, FuzzTestState>,
	"workloadName" | "generatorFactory"
> = {
	reducer:
		// makeReducer supports a param for logging output which tracks the provided intervalId over time:
		// { intervalId: "00000000-0000-0000-0000-000000000000", clientIds: ["A", "B", "C"] }
		makeReducer(),
	validateConsistency: async (a, b) => assertEquivalentSharedStrings(a.channel, b.channel),
	factory: new SharedStringFuzzFactory(),
	minimizationTransforms: [
		(op) => {
			if (op.type !== "addText") {
				return;
			}
			op.content = op.content.slice(1);
		},
		(op) => {
			switch (op.type) {
				case "addText":
					if (op.index > 0) {
						op.index -= 1;
					}
					break;
				case "removeRange":
				case "annotateRange":
				case "addInterval":
				case "changeInterval":
					if (op.start !== undefined && op.start > 0) {
						op.start -= 1;
					}
					if (op.end !== undefined && op.end > 0) {
						op.end -= 1;
					}
					break;
				default:
					break;
			}
		},
		(op) => {
			if (
				op.type !== "removeRange" &&
				op.type !== "annotateRange" &&
				op.type !== "addInterval" &&
				op.type !== "changeInterval"
			) {
				return;
			}
			if (op.end !== undefined && op.end > 0) {
				op.end -= 1;
			}
		},
	],
};

export const defaultFuzzOptions: Partial<DDSFuzzSuiteOptions> = {
	validationStrategy: { type: "fixedInterval", interval: 10 },
	reconnectProbability: 0.1,
	numberOfClients: 3,
	clientJoinOptions: {
		maxNumberOfClients: 6,
		clientAddProbability: 0.1,
	},
	defaultTestCount: 100,
	saveFailures: { directory: path.join(_dirname, "../../src/test/fuzz/results") },
};

export function makeIntervalOperationGenerator(
	optionsParam?: IntervalOperationGenerationConfig,
	alwaysLeaveChar: boolean = false,
): AsyncGenerator<Operation, ClientOpState> {
	const {
		startPosition,
		addText,
		obliterateRange,
		removeRange,
		annotateRange,
		removeRangeLeaveChar,
		lengthSatisfies,
		hasNonzeroLength,
		isShorterThanMaxLength,
	} = createSharedStringGeneratorOperations(optionsParam);

	const options = { ...defaultIntervalOperationGenerationConfig, ...(optionsParam ?? {}) };

	function isNonEmpty(collection: IIntervalCollection<SequenceInterval>): boolean {
		for (const _ of collection) {
			return true;
		}

		return false;
	}

	function inclusiveRange(state: ClientOpState): RangeSpec {
		const start = startPosition(state);
		const end = state.random.integer(
			start,
			Math.max(start, state.client.channel.getLength() - 1),
		);
		return { start, end };
	}

	function inclusiveRangeWithUndefined(
		state: ClientOpState,
	): RangeSpec | { start: undefined; end: undefined } {
		return state.random.bool() ? inclusiveRange(state) : { start: undefined, end: undefined };
	}

	function propertySet(state: ClientOpState): PropertySet {
		const propNamesShuffled = [...options.propertyNamePool];
		state.random.shuffle(propNamesShuffled);
		const propsToChange = propNamesShuffled.slice(
			0,
			state.random.integer(1, propNamesShuffled.length),
		);
		const propSet: PropertySet = {};
		for (const name of propsToChange) {
			propSet[name] = state.random.string(5);
		}
		return propSet;
	}

	function propertySetWithUndefined(state: ClientOpState): PropertySet | undefined {
		return state.random.bool() ? propertySet(state) : undefined;
	}

	function nonEmptyIntervalCollection({ client, random }: ClientOpState): string {
		const nonEmptyLabels = Array.from(client.channel.getIntervalCollectionLabels()).filter(
			(label) => {
				const collection = client.channel.getIntervalCollection(label);
				return isNonEmpty(collection);
			},
		);
		return random.pick(nonEmptyLabels);
	}

	function interval(state: ClientOpState): { collectionName: string; id: string } {
		const collectionName = nonEmptyIntervalCollection(state);
		const intervals = Array.from(state.client.channel.getIntervalCollection(collectionName));
		const id = state.random.pick(intervals)?.getIntervalId();
		assert(id);

		return {
			id,
			collectionName,
		};
	}

	async function addInterval(state: ClientOpState): Promise<AddInterval> {
		return {
			type: "addInterval",
			...inclusiveRange(state),
			collectionName: state.random.pick(options.intervalCollectionNamePool),
			id: state.random.uuid4(),
			startSide: state.random.pick([Side.Before, Side.After]),
			endSide: state.random.pick([Side.Before, Side.After]),
		};
	}

	async function deleteInterval(state: ClientOpState): Promise<DeleteInterval> {
		return {
			type: "deleteInterval",
			...interval(state),
		};
	}

	async function changeInterval(state: ClientOpState): Promise<ChangeInterval> {
		const { start, end } = inclusiveRangeWithUndefined(state);
		const properties = propertySetWithUndefined(state);
		return {
			type: "changeInterval",
			start,
			end,
			startSide: state.random.pick([Side.Before, Side.After]),
			endSide: state.random.pick([Side.Before, Side.After]),
			properties,
			...interval(state),
		};
	}

	const hasAnInterval = ({ client }: ClientOpState): boolean =>
		Array.from(client.channel.getIntervalCollectionLabels()).some((label) => {
			const collection = client.channel.getIntervalCollection(label);
			return isNonEmpty(collection);
		});

	const hasNotTooManyIntervals: AcceptanceCondition<ClientOpState> = ({ client }) => {
		let intervalCount = 0;
		for (const label of client.channel.getIntervalCollectionLabels()) {
			for (const _ of client.channel.getIntervalCollection(label)) {
				intervalCount++;
				if (intervalCount >= options.maxIntervals) {
					return false;
				}
			}
		}
		return true;
	};

	const all =
		<T>(...clauses: AcceptanceCondition<T>[]): AcceptanceCondition<T> =>
		(t: T) =>
			clauses.reduce<boolean>((prev, cond) => prev && cond(t), true);
	const usableWeights =
		optionsParam?.weights ?? defaultIntervalOperationGenerationConfig.weights;
	return createWeightedAsyncGenerator<Operation, ClientOpState>([
		[addText, usableWeights.addText, isShorterThanMaxLength],
		[
			alwaysLeaveChar ? removeRangeLeaveChar : removeRange,
			usableWeights.removeRange,
			alwaysLeaveChar
				? lengthSatisfies((length) => {
						return length > 1;
					})
				: hasNonzeroLength,
		],
		[annotateRange, usableWeights.annotateRange, hasNonzeroLength],
		[obliterateRange, usableWeights.obliterateRange, hasNonzeroLength],
		[addInterval, usableWeights.addInterval, all(hasNotTooManyIntervals, hasNonzeroLength)],
		[deleteInterval, usableWeights.deleteInterval, hasAnInterval],
		[changeInterval, usableWeights.changeInterval, all(hasAnInterval, hasNonzeroLength)],
	]);
}
