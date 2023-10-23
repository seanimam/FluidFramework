/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export {
	Dependee,
	Dependent,
	NamedComputation,
	ObservingDependent,
	InvalidationToken,
	recordDependency,
	SimpleDependee,
	EmptyKey,
	FieldKey,
	TreeType,
	Value,
	TreeValue,
	AnchorSet,
	DetachedField,
	UpPath,
	Range,
	RangeUpPath,
	PlaceUpPath,
	DetachedRangeUpPath,
	DetachedPlaceUpPath,
	PlaceIndex,
	NodeIndex,
	FieldUpPath,
	Anchor,
	RootField,
	ChildCollection,
	ChildLocation,
	DeltaVisitor,
	AnnouncedVisitor,
	FieldMapObject,
	NodeData,
	GenericTreeNode,
	JsonableTree,
	Delta,
	rootFieldKey,
	rootField,
	fieldSchema,
	ITreeCursor,
	CursorLocationType,
	ITreeCursorSynchronous,
	GenericFieldsNode,
	AnchorLocator,
	TreeNavigationResult,
	IEditableForest,
	IForestSubscription,
	TreeLocation,
	FieldLocation,
	ForestLocation,
	ITreeSubscriptionCursor,
	ITreeSubscriptionCursorState,
	TreeNodeSchemaIdentifier,
	TreeFieldStoredSchema,
	ValueSchema,
	TreeNodeStoredSchema,
	StoredSchemaRepository,
	FieldKindIdentifier,
	TreeTypeSet,
	TreeStoredSchema,
	FieldAnchor,
	SchemaEvents,
	ChangesetLocalId,
	ForestEvents,
	PathRootPrefix,
	AnchorSlot,
	AnchorNode,
	anchorSlot,
	UpPathDefault,
	AnchorEvents,
	AnchorSetRootEvents,
	FieldKindSpecifier,
	AllowedUpdateType,
	PathVisitor,
	Adapters,
	TreeAdapter,
	MapTree,
	Revertible,
	RevertibleKind,
	RevertResult,
	DiscardResult,
	forbiddenFieldKindIdentifier,
	StoredSchemaCollection,
} from "./core";

export {
	Brand,
	Opaque,
	extractFromOpaque,
	brand,
	brandOpaque,
	ValueFromBranded,
	NameFromBranded,
	JsonCompatibleReadOnly,
	JsonCompatible,
	JsonCompatibleObject,
	NestedMap,
	fail,
	IdAllocator,
	TransactionResult,
	BrandedKey,
	BrandedMapSubset,
	RangeEntry,
	Named,
	oneFromSet,
} from "./util";

export {
	Events,
	IsEvent,
	ISubscribable,
	createEmitter,
	IEmitter,
	NoListenersCallback,
	HasListeners,
} from "./events";

export {
	cursorToJsonObject,
	singleJsonCursor,
	jsonArray,
	jsonObject,
	jsonSchema,
	nodeKeyField,
	nodeKeySchema,
	leaf,
	SchemaBuilder,
} from "./domains";

export {
	FieldKind,
	Multiplicity,
	isNeverField,
	FullSchemaPolicy,
	UnwrappedEditableField,
	isEditableTree,
	isEditableField,
	EditableTreeContext,
	UnwrappedEditableTree,
	EditableTreeOrPrimitive,
	EditableTree,
	EditableField,
	isPrimitive,
	getPrimaryField,
	typeSymbol,
	typeNameSymbol,
	valueSymbol,
	proxyTargetSymbol,
	getField,
	contextSymbol,
	ContextuallyTypedNodeDataObject,
	ContextuallyTypedNodeData,
	MarkedArrayLike,
	isContextuallyTypedNodeDataObject,
	defaultSchemaPolicy,
	jsonableTreeFromCursor,
	PrimitiveValue,
	StableNodeKey,
	LocalNodeKey,
	compareLocalNodeKeys,
	localNodeKeySymbol,
	IDefaultEditBuilder,
	ValueFieldEditBuilder,
	OptionalFieldEditBuilder,
	SequenceFieldEditBuilder,
	prefixPath,
	prefixFieldPath,
	singleTextCursor,
	singleStackTreeCursor,
	CursorAdapter,
	CursorWithNode,
	parentField,
	EditableTreeEvents,
	on,
	InternalTypedSchemaTypes,
	SchemaAware,
	ArrayLikeMut,
	FieldKinds,
	ContextuallyTypedFieldData,
	cursorFromContextualData,
	UntypedField,
	UntypedTree,
	UntypedTreeContext,
	UntypedTreeCore,
	UnwrappedUntypedField,
	UnwrappedUntypedTree,
	UntypedTreeOrPrimitive,
	AllowedTypes,
	TreeNodeSchema,
	TreeSchema,
	SchemaLibrary,
	SchemaLibraryData,
	TreeFieldSchema,
	Any,
	NewFieldContent,
	NodeExistsConstraint,
	cursorForTypedTreeData,
	LazyTreeNodeSchema,
	FieldGenerator,
	TreeDataContext,
	createDataBinderBuffering,
	createDataBinderDirect,
	createDataBinderInvalidating,
	createBinderOptions,
	createFlushableBinderOptions,
	DataBinder,
	BinderOptions,
	Flushable,
	FlushableBinderOptions,
	FlushableDataBinder,
	MatchPolicy,
	SubtreePolicy,
	BindSyntaxTree,
	indexSymbol,
	BindPolicy,
	BindTree,
	BindTreeDefault,
	DownPath,
	BindPath,
	PathStep,
	BindingType,
	BindingContextType,
	BindingContext,
	VisitorBindingContext,
	DeleteBindingContext,
	InsertBindingContext,
	BatchBindingContext,
	InvalidationBindingContext,
	OperationBinderEvents,
	InvalidationBinderEvents,
	CompareFunction,
	BinderEventsCompare,
	AnchorsCompare,
	toDownPath,
	comparePipeline,
	compileSyntaxTree,
	nodeKeyFieldKey,
	SchemaLintConfiguration,
	TreeStatus,
	treeStatus,
	FieldNode,
	FlexibleFieldContent,
	FlexibleNodeContent,
	InternalEditableTreeTypes,
	Leaf,
	MapNode,
	OptionalField,
	RequiredField,
	Sequence,
	ObjectNode,
	ObjectNodeTyped,
	AssignableFieldKinds,
	TreeContext,
	TypedField,
	TypedNode,
	TypedNodeUnion,
	Tree,
	TreeField,
	TreeNode,
	FieldNodeSchema,
	LeafSchema,
	MapSchema,
	ObjectNodeSchema,
	CheckTypesOverlap,
	SchemaBuilderBase,
	ImplicitFieldSchema,
	ImplicitAllowedTypes,
	Unenforced,
	schemaIsFieldNode,
	AllowedTypeSet,
	SchemaBuilderOptions,
	SharedTreeList,
	ObjectFields,
	ProxyField,
	ProxyFieldInner,
	ProxyNode,
	ProxyNodeUnion,
	SharedTreeMap,
	SharedTreeObject,
	is,
	node,
	SharedTreeNode,
	Typed,
	TreeEvent,
	SharedTreeObjectFactory,
	SchemaCollection,
	FactoryTreeSchema,
} from "./feature-libraries";

export {
	ISharedTree,
	ISharedTreeView,
	ITransaction,
	runSynchronous,
	SharedTreeFactory,
	SharedTreeOptions,
	ISharedTreeBranchView,
	ViewEvents,
	SchematizeConfiguration,
	TreeContent,
	InitializeAndSchematizeConfiguration,
	SchemaConfiguration,
	ForestType,
	TypedTreeFactory,
	TypedTreeOptions,
	TypedTreeChannel,
} from "./shared-tree";

export type { ICodecOptions, JsonValidator, SchemaValidationFunction } from "./codec";
export { noopValidator } from "./codec";
export { typeboxValidator } from "./external-utilities";

// Below here are things that are used by the above, but not part of the desired API surface.
import * as InternalTypes from "./internal";
export { InternalTypes };
