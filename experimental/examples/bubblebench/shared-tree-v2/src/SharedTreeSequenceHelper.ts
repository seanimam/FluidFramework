/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    Anchor,
    FieldKey,
    ISharedTree,
    JsonableTree,
    singleTextCursor,
    TransactionResult,
} from "@fluid-internal/tree";
import { SharedTreeNodeHelper } from "./SharedTreeNodeHelper";

export class SharedTreeSequenceHelper {
    private readonly treeNodeHelper: SharedTreeNodeHelper;
    constructor(
        public readonly tree: ISharedTree,
        public readonly parentAnchor: Anchor,
        public readonly sequenceFieldKey: FieldKey,
    ) {
        this.treeNodeHelper = new SharedTreeNodeHelper(tree, parentAnchor);
    }

    public getAnchor(index: number): Anchor {
        const cursor = this.treeNodeHelper.getCursor();
        cursor.enterField(this.sequenceFieldKey);
        cursor.enterNode(index);
        const treeNode: Anchor = cursor.buildAnchor();
        cursor.free();
        return treeNode;
    }

    public get(index: number): SharedTreeNodeHelper {
        return new SharedTreeNodeHelper(this.tree, this.getAnchor(index));
    }

    public getAllAnchors() {
        const nodeAnchors: Anchor[] = [];
        // const cursor = this.treeNodeHelper.getCursor();
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorToNode(this.parentAnchor, cursor);
        cursor.enterField(this.sequenceFieldKey);
        let currentNode = cursor.firstNode();
        if (currentNode === false) {
            cursor.free();
            return nodeAnchors; // The node has no members in its sequence.
        }
        while (currentNode === true) {
            nodeAnchors.push(cursor.buildAnchor());
            currentNode = cursor.nextNode();
        }

        cursor.free();
        return nodeAnchors;
    }

    public getAll(): SharedTreeNodeHelper[] {
        return this.getAllAnchors().map(
            (anchor) => new SharedTreeNodeHelper(this.tree, anchor),
        );
    }

    public length(): number {
        const cursor = this.treeNodeHelper.getCursor();
        cursor.enterField(this.sequenceFieldKey);
        const length: number = cursor.getFieldLength();
        cursor.free();
        return length;
    }

    public push(jsonTree: JsonableTree): void {
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorToNode(this.parentAnchor, cursor);

        this.tree.runTransaction((forest, editor) => {
            const parentPath = this.tree.locate(cursor.buildAnchor());
            if (!parentPath) {
                throw new Error("path to anchor does not exist");
            }
            const field = editor.sequenceField(
                parentPath,
                this.sequenceFieldKey,
            );
            this.tree.context.prepareForEdit();
            cursor.free();
            field.insert(this.length(), singleTextCursor(jsonTree));
            return TransactionResult.Apply;
        });
    }

    public pop(): void {
        this.tree.runTransaction((forest, editor) => {
            const cursor = this.treeNodeHelper.getCursor();
            const parentPath = this.tree.locate(cursor.buildAnchor());
            const field = editor.sequenceField(
                parentPath,
                this.sequenceFieldKey,
            );
            this.tree.context.prepareForEdit();
            cursor.free();
            field.delete(this.length() - 1, 1);
            return TransactionResult.Apply;
        });
    }
}
