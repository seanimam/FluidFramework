/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export {
	createRevertDriver,
	getStats,
	MergeTreeStats,
	specToSegment,
	TestClient,
	TestClientRevertibleDriver,
} from "./testClient.js";
export { checkTextMatchRelative, TestServer } from "./testServer.js";
export {
	countOperations,
	insertMarker,
	insertSegments,
	insertText,
	loadTextFromFile,
	loadTextFromFileWithMarkers,
	markRangeRemoved,
	nodeOrdinalsHaveIntegrity,
	validatePartialLengths,
	useStrictPartialLengthChecks,
} from "./testUtils.js";
export {
	annotateRange,
	applyMessages,
	doOverRange,
	generateClientNames,
	generateOperationMessagesForClients,
	IConfigRange,
	IMergeTreeOperationRunnerConfig,
	insertAtRefPos,
	removeRange,
	ReplayGroup,
	replayResultsPath,
	runMergeTreeOperationRunner,
	TestOperation,
} from "./mergeTreeOperationRunner.js";
export {
	LRUSegment,
	MergeTree,
	IMergeTreeOptions,
	IMergeTreeOptionsInternal,
} from "../mergeTree.js";
export { MergeTreeTextHelper } from "../MergeTreeTextHelper.js";
export { SnapshotLegacy } from "../snapshotlegacy.js";
export {
	addProperties,
	appendToMergeTreeDeltaRevertibles,
	BaseSegment,
	Client,
	CollaborationWindow,
	compareReferencePositions,
	ConflictAction,
	createAnnotateRangeOp,
	createDetachedLocalReferencePosition,
	createGroupOp,
	createInsertOp,
	createInsertSegmentOp,
	createMap,
	createRemoveRangeOp,
	debugMarkerToString,
	DetachedReferencePosition,
	discardMergeTreeDeltaRevertible,
	IJSONMarkerSegment,
	IJSONSegment,
	IMarkerDef,
	IMergeNodeCommon,
	IMergeTreeAnnotateMsg,
	IMergeTreeClientSequenceArgs,
	IMergeTreeDelta,
	IMergeTreeDeltaCallbackArgs,
	IMergeTreeDeltaOp,
	IMergeTreeDeltaOpArgs,
	IMergeTreeGroupMsg,
	IMergeTreeInsertMsg,
	IMergeTreeMaintenanceCallbackArgs,
	IMergeTreeOp,
	IMergeTreeRemoveMsg,
	IMergeTreeSegmentDelta,
	IMergeTreeTextHelper,
	IRBAugmentation,
	IRBMatcher,
	IRelativePosition,
	IRemovalInfo,
	ISegment,
	ISegmentAction,
	KeyComparer,
	LocalReferenceCollection,
	LocalReferencePosition,
	MapLike,
	Marker,
	matchProperties,
	maxReferencePosition,
	MergeNode,
	MergeTreeDeltaOperationType,
	MergeTreeDeltaOperationTypes,
	MergeTreeDeltaRevertible,
	MergeTreeDeltaType,
	MergeTreeMaintenanceType,
	MergeTreeRevertibleDriver,
	minReferencePosition,
	PropertiesManager,
	Property,
	PropertyAction,
	PropertySet,
	RBNode,
	RBNodeActions,
	RedBlackTree,
	ReferencePosition,
	ReferenceType,
	refGetTileLabels,
	refHasTileLabel,
	refHasTileLabels,
	refTypeIncludesFlag,
	reservedMarkerIdKey,
	reservedMarkerSimpleTypeKey,
	reservedTileLabelsKey,
	revertMergeTreeDeltaRevertibles,
	SegmentGroup,
	SegmentGroupCollection,
	SortedSegmentSet,
	SortedSegmentSetItem,
	SortedSet,
	TextSegment,
	toRemovalInfo,
	Trackable,
	TrackingGroup,
	TrackingGroupCollection,
	UnassignedSequenceNumber,
	UniversalSequenceNumber,
} from "../index.js";
