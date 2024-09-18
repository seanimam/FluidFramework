/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { TreeArrayNode } from "@fluidframework/tree";
import type { z } from "zod";

import {
	createMergableDiffSeries,
	createMergableIdDiffSeries,
	sharedTreeDiff,
	type Difference,
	type ObjectPath,
} from "./sharedTreeDiff.js";
import { isTreeMapNode, isTreeArrayNode, sharedTreeTraverse } from "./utils.js";

/**
 * Manages determining the differences between two branches of a SharedTree represented as an actual tree node or a plain javascript object
 * and applies said differences to the original SharedTree branch.
 */
export class SharedTreeBranchManager {
	private readonly objectSchema?: z.Schema;
	private readonly nodeIdAttributeName?: string;

	public constructor(params?: { objectSchema?: z.Schema; nodeIdAttributeName?: string }) {
		this.objectSchema = params?.objectSchema;
		this.nodeIdAttributeName = params?.nodeIdAttributeName;
	}

	/**
	 * Compares the differences between either two objects or a TreeeNode and a plain object.
	 * TODO: Should allow comparing two tree nodes? Should we allowe comparing two plain objects? Or just leave as tree node vs object?
	 */
	public compare(
		obj: Record<string, unknown> | TreeArrayNode,
		newObj: Record<string, unknown> | unknown[],
	): Difference[] {
		// By validating that the incoming object matches the schema, we can confirm that any property
		// deletions/updates/additions are valid.
		if (this.objectSchema !== undefined) {
			const res = this.objectSchema.safeParse(newObj);
			if (res.success === false) {
				throw new TypeError("Invalid data");
			}
		}

		const diffTotality = sharedTreeDiff(obj as Record<string, unknown> | unknown[], newObj, {
			useObjectIds:
				this.nodeIdAttributeName === undefined
					? undefined
					: { idAttributeName: this.nodeIdAttributeName },
			cyclesFix: true,
		});

		if (this.nodeIdAttributeName !== undefined) {
			return createMergableIdDiffSeries(obj, diffTotality, this.nodeIdAttributeName);
		}

		return createMergableDiffSeries(diffTotality);
	}

	/**
	 * produces a diff between two objects and merges the differences.
	 */
	public merge(
		obj: Record<string, unknown> | TreeArrayNode,
		newObj: Record<string, unknown> | unknown[],
	): void {
		const differences = this.compare(obj, newObj);
		this.mergeDiffs(differences, obj);
	}

	/**
	 * Handles applying an array of differences to an object in the proper order and making any necessary adjustments as each diff
	 * is applied.
	 *
	 * @returns an array of differences that were not applied due to some kind of conflict or error.
	 */
	public mergeDiffs(
		diffs: Difference[],
		objectToUpdate: Record<string, unknown> | TreeArrayNode,
	): Set<Difference> {
		const unappliedDiffs = new Set<Difference>();

		for (const diff of diffs) {
			const isDiffApplied = this.applyDiff(diff, objectToUpdate);

			if (isDiffApplied === false) {
				unappliedDiffs.add(diff);
			}
		}

		return unappliedDiffs;
	}

	/**
	 * Applies an individual diff to the objectToUpdate.
	 */
	public applyDiff(
		diff: Difference,
		objectToUpdate: Record<string, unknown> | TreeArrayNode,
	): boolean {
		const targetObject: unknown = getTargetObjectFromPath(diff.path, objectToUpdate);

		if (isTreeMapNode(targetObject)) {
			switch (diff.type) {
				case "CHANGE":
				case "CREATE": {
					targetObject.set(diff.path[diff.path.length - 1] as string, diff.value);
					return true;
				}
				case "REMOVE": {
					targetObject.delete(diff.path[diff.path.length - 1] as string);
					return true;
				}
				default: {
					throw new TypeError("Unsupported diff type for Map Tree Node");
				}
			}
		} else if (isTreeArrayNode(targetObject)) {
			const targetIndex = diff.path[diff.path.length - 1] as number;
			const isTargetIndexValid = targetIndex >= 0 && targetIndex <= targetObject.length - 1;
			switch (diff.type) {
				case "CHANGE":
				case "CREATE": {
					if (isTargetIndexValid) {
						targetObject.insertAt(targetIndex, diff.value);
						return true;
					} else {
						targetObject.insertAtEnd(diff.value);
						console.warn(
							"CREATE diff specified an invalid index, defaulting to pushing to end of array",
						);
						return false;
					}
				}
				case "MOVE": {
					if (isTargetIndexValid) {
						if (diff.newIndex > targetIndex) {
							// forward move must use i + 1
							targetObject.moveToIndex(diff.newIndex + 1, targetIndex);
						} else if (diff.newIndex < targetIndex) {
							// backwards move, using i directly is fine
							targetObject.moveToIndex(diff.newIndex, targetIndex);
						}
						return true;
					} else {
						console.warn("MOVE diff specified an invalid index, ignoring.");
						return false;
					}
				}
				case "REMOVE": {
					if (isTargetIndexValid) {
						targetObject.removeAt(targetIndex);
						return true;
					} else {
						console.warn("REMOVE diff specified an invalid index, ignoring.");
						return false;
					}
				}
				default: {
					throw new TypeError("Unsupported diff type for Array Tree Node");
				}
			}
		} else if (typeof targetObject === "object" && targetObject !== null) {
			switch (diff.type) {
				case "CHANGE":
				case "CREATE": {
					targetObject[diff.path[diff.path.length - 1] as string] = diff.value;
					return true;
				}
				case "REMOVE": {
					// We can't use the delete keyword on a tree node.
					targetObject[diff.path[diff.path.length - 1] as string] = undefined;
					return false;
				}
				default: {
					throw new TypeError("Unsupported diff type for Object Tree Node");
				}
			}
		} else {
			throw new TypeError("Unsupported object type for diff application");
		}
	}
}

/**
 * Returns the target object that the given diff should be applied to.
 */
function getTargetObjectFromPath(
	path: ObjectPath,
	object: Record<string, unknown> | TreeArrayNode,
): unknown {
	let targetObject: unknown = object;
	if (path.length > 1) {
		targetObject = sharedTreeTraverse(object, path.slice(0, -1));
	}
	return targetObject;
}
