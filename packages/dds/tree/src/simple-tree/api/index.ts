/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export {
	type ITree,
	type TreeView,
	type ViewableTree,
	type TreeViewEvents,
	TreeViewConfiguration,
	type ITreeViewConfiguration,
	type SchemaCompatibilityStatus,
	type ITreeConfigurationOptions,
	type TreeViewAlpha,
} from "./tree.js";
export { SchemaFactory, type ScopedSchemaName } from "./schemaFactory.js";
export type {
	ValidateRecursiveSchema,
	FixRecursiveArraySchema,
} from "./schemaFactoryRecursive.js";
export {
	adaptEnum,
	enumFromStrings,
	singletonSchema,
	typedObjectValues,
} from "./schemaCreationUtilities.js";
export { treeNodeApi, type TreeNodeApi } from "./treeNodeApi.js";
export { createFromInsertable, cursorFromInsertable } from "./create.js";
export type {
	SimpleTreeSchema,
	SimpleNodeSchema,
	SimpleFieldSchema,
	SimpleLeafNodeSchema,
	SimpleMapNodeSchema,
	SimpleArrayNodeSchema,
	SimpleObjectNodeSchema,
	SimpleNodeSchemaBase,
} from "./simpleSchema.js";
export {
	type JsonSchemaId,
	type JsonSchemaType,
	type JsonObjectNodeSchema,
	type JsonArrayNodeSchema,
	type JsonMapNodeSchema,
	type JsonLeafNodeSchema,
	type JsonSchemaRef,
	type JsonRefPath,
	type JsonNodeSchema,
	type JsonNodeSchemaBase,
	type JsonTreeSchema,
	type JsonFieldSchema,
	type JsonLeafSchemaType,
} from "./jsonSchema.js";
export { getJsonSchema } from "./getJsonSchema.js";
export { getSimpleSchema } from "./getSimpleSchema.js";
export { ViewSchema } from "./view.js";
export type {
	Unenforced,
	FieldHasDefaultUnsafe,
	ObjectFromSchemaRecordUnsafe,
	TreeObjectNodeUnsafe,
	TreeFieldFromImplicitFieldUnsafe,
	TreeNodeFromImplicitAllowedTypesUnsafe,
	FieldSchemaUnsafe,
	InsertableTreeNodeFromImplicitAllowedTypesUnsafe,
	TreeArrayNodeUnsafe,
	TreeMapNodeUnsafe,
	InsertableObjectFromSchemaRecordUnsafe,
	InsertableTreeFieldFromImplicitFieldUnsafe,
	InsertableTypedNodeUnsafe,
	NodeBuilderDataUnsafe,
	NodeFromSchemaUnsafe,
	ReadonlyMapInlined,
	TreeNodeSchemaClassUnsafe,
	TreeNodeSchemaUnsafe,
	AllowedTypesUnsafe,
	TreeNodeSchemaNonClassUnsafe,
} from "./typesUnsafe.js";

export type {
	VerboseTreeNode,
	ParseOptions,
	VerboseTree,
} from "./verboseTree.js";

export type { EncodeOptions } from "./customTree.js";

export type { ConciseTree } from "./conciseTree.js";

export { TreeBeta, type NodeChangedData, type TreeChangeEventsBeta } from "./treeApiBeta.js";

export {
	extractPersistedSchema,
	comparePersistedSchemaInternal,
	comparePersistedSchema,
} from "./storedSchema.js";

// Exporting the schema (RecursiveObject) to test that recursive types are working correctly.
// These are `@internal` so they can't be included in the `InternalClassTreeTypes` due to https://github.com/microsoft/rushstack/issues/3639
export {
	RecursiveObject as test_RecursiveObject,
	base as test_RecursiveObject_base,
	RecursiveObjectPojoMode as test_RecursiveObjectPojoMode,
} from "./testRecursiveDomain.js";
