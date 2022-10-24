import { TransactionResult } from "../../../checkout";
import { singleTextCursor } from "../../../feature-libraries";
import { ITreeSubscriptionCursor, TreeNavigationResult } from "../../../forest";
import { ISharedTree } from "../../../shared-tree";
import { Anchor, FieldKey, JsonableTree } from "../../../tree";
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

    public get(index: number): [ITreeSubscriptionCursor, TreeNavigationResult] {
        const cursor = this.treeNodeHelper.getRootCursor();
        return [cursor, cursor.down(this.sequenceFieldKey, index)];
    }

    public getAll(): [ITreeSubscriptionCursor, Anchor[]] {
        const result: Anchor[] = [];
        const [cursor, navResult] = this.get(0);
        if (navResult === TreeNavigationResult.NotFound) {
            return [cursor, result];
        }

        result.push(cursor.buildAnchor());

        let currNavResult: TreeNavigationResult = navResult;
        while (currNavResult === TreeNavigationResult.Ok) {
            currNavResult = cursor.seek(1);
            if (currNavResult === TreeNavigationResult.Ok) {
                result.push(cursor.buildAnchor());
            }
        }
        return [cursor, result];
    }


    public length() {
        const cursor = this.treeNodeHelper.getRootCursor();
        const length = cursor.length(this.sequenceFieldKey);
        cursor.free();
        return length;
    }

    // How can you push to the end of the sequence rather than the beginning in one
    public push(jsonTree: JsonableTree) {
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorTo(this.parentAnchor, cursor);

        this.tree.runTransaction((forest, editor) => {
            const parentPath = this.tree.locate(cursor.buildAnchor());
            if (!parentPath) {
                throw new Error("path to anchor does not exist")
            }
            this.tree.context.prepareForEdit();
            const finalPath = {
                parent: parentPath,
                parentField: this.sequenceFieldKey,
                parentIndex: this.length()
            };
            cursor.free();
            editor.insert(finalPath,
                singleTextCursor(jsonTree));
            return TransactionResult.Apply;
        });
    }

    public insert(jsonTree: JsonableTree, index: number) {
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorTo(this.parentAnchor, cursor);

        this.tree.runTransaction((forest, editor) => {
            const parentPath = this.tree.locate(cursor.buildAnchor());
            if (!parentPath) {
                throw new Error("path to anchor does not exist")
            }
            this.tree.context.prepareForEdit();
            const finalPath = {
                parent: parentPath,
                parentField: this.sequenceFieldKey,
                parentIndex: index
            };
            cursor.free();
            editor.insert(finalPath,
                singleTextCursor(jsonTree));
            return TransactionResult.Apply;
        });
    }


    public pop() {
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorTo(this.parentAnchor, cursor);
        cursor.down(this.sequenceFieldKey, this.length() - 1);
        this.tree.runTransaction((forest, editor) => {
            const path = this.tree.locate(cursor.buildAnchor());
            if (!path) {
                throw new Error("path to anchor does not exist")
            }
            this.tree.context.prepareForEdit();
            cursor.free();
            editor.delete(path, 1);
            return TransactionResult.Apply;
        });
    }

}
