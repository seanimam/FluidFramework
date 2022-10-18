import { ITreeSubscriptionCursor, TreeNavigationResult } from "../../../forest";
import { ISharedTree } from "../../../shared-tree";
import { Anchor, FieldKey } from "../../../tree";

export class SharedTreeSequenceHelper {

    constructor(
        public readonly tree: ISharedTree,
        public readonly parentAnchor: Anchor,
        public readonly sequenceFieldKey: FieldKey,
    ) {
    }

    public get(index: number): [ITreeSubscriptionCursor, TreeNavigationResult] {
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorTo(this.parentAnchor, cursor);
        return [cursor, cursor.down(this.sequenceFieldKey, index)];
    }

    public length() {
        const cursor = this.tree.forest.allocateCursor();
        this.tree.forest.tryMoveCursorTo(this.parentAnchor, cursor);
        const length = cursor.length(this.sequenceFieldKey);
        cursor.free();
        return length;
    }

}
