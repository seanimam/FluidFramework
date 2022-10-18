import { TransactionResult } from "../../../checkout";
import { ISharedTree } from "../../../shared-tree";
import { Anchor, FieldKey, Value } from "../../../tree";

export class SharedTreeNodeHelper {
    constructor(
        public readonly tree: ISharedTree,
        public readonly anchor: Anchor
    ) { }

    getFieldValue(fieldKey: FieldKey) {
        const cursor = this.getRootCursor();
        cursor.down(fieldKey, 0);
        const value = cursor.value;
        cursor.free();
        return value;
    }

    /**
     * @returns A cursor pointing to the root of the tree
     * which is the node that this class governs
     */
    getRootCursor() {
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorTo(this.anchor, cursor);
        return cursor;
    }

    /**
     * Modifies the value at the given FieldKey within the SharedTree node held by this class instance.
     */
    editFieldValue(fieldKey: FieldKey, value: Value) {
        const cursor = this.getRootCursor();
        cursor.down(fieldKey, 0);
        const fieldAnchor = cursor.buildAnchor();
        this.tree.runTransaction((forest, editor) => {
            const path = this.tree.locate(fieldAnchor)
            if (!path) {
                throw new Error("path to anchor does not exist")
            }
            this.tree.context.prepareForEdit();
            cursor.free();
            editor.setValue(path, value);
            return TransactionResult.Apply;
        });
    }

}
