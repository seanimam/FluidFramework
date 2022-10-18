import { TreeNavigationResult } from "../../../forest";
import { ISharedTree } from "../../../shared-tree";
import { Anchor, FieldKey } from "../../../tree";
import { brand } from "../../../util";
import { Bubble } from "./Bubble";
import { SharedTreeNodeHelper } from "./SharedTreeNodeHelper";
import { SharedTreeSequenceHelper } from "./SharedTreeSequenceHelper";

export class Client {
    static clientIdFieldKey: FieldKey = brand('clientId');
    static colorFieldKey: FieldKey = brand('color');
    static bubblesFieldKey: FieldKey = brand('bubbles');

    private readonly treeHelper: SharedTreeNodeHelper;
    private readonly bubbleSeqeunceHelper: SharedTreeSequenceHelper;

    constructor(
        public readonly tree: ISharedTree,
        public readonly anchor: Anchor
    ) {
        this.treeHelper = new SharedTreeNodeHelper(tree, anchor);
        this.bubbleSeqeunceHelper = new SharedTreeSequenceHelper(tree, anchor, Client.bubblesFieldKey);
    }

    public get clientId() { return this.treeHelper.getFieldValue(Client.clientIdFieldKey) as string }
    public set clientId(value: string) { this.treeHelper.editFieldValue(Client.clientIdFieldKey, value); }

    public get color() { return this.treeHelper.getFieldValue(Client.colorFieldKey) as string }
    public set color(value: string) { this.treeHelper.editFieldValue(Client.colorFieldKey, value); }

    public get bubbles() {
        const resultBubbles: Bubble[] = [];
        const [cursor, navResult] = this.bubbleSeqeunceHelper.get(0);
        if (navResult === TreeNavigationResult.NotFound) {
            cursor.free();
            return resultBubbles;
        }

        resultBubbles.push(new Bubble(this.tree, cursor.buildAnchor()));

        let currNavResult: TreeNavigationResult = navResult;
        while (currNavResult === TreeNavigationResult.Ok) {
            currNavResult = cursor.seek(1);
            if (currNavResult === TreeNavigationResult.Ok) {
                resultBubbles.push(new Bubble(this.tree, cursor.buildAnchor()));
            }
        }

        return resultBubbles;
    }


}
