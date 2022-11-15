/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
// import { brand, ISharedTree, JsonableTree, moveToDetachedField } from "@fluid-internal/tree";
import { TransactionResult } from "../../../checkout";
import { IDefaultEditBuilder } from "../../../feature-libraries";
import { moveToDetachedField } from "../../../forest";
import { ISharedTree } from "../../../shared-tree";
import { JsonableTree } from "../../../tree";
import { brand } from "../../../util";
import { Client } from "./Client";
import { iBubbleSchema, iClientSchema, int32Schema, stringSchema } from "./schema";
import { SharedTreeNodeHelper } from "./SharedTreeNodeHelper";
import { SharedTreeSequenceHelper } from "./SharedTreeSequenceHelper";

export class AppState {
    readonly clientsSequenceHelper: SharedTreeSequenceHelper;
    readonly editBuilderCallbacks: ((editor: IDefaultEditBuilder) => void)[] = [];
    readonly localClientNode: SharedTreeNodeHelper;

    constructor(
        private readonly tree: ISharedTree,
        private _width: number,
        private _height: number,
        numBubbles: number,
    ) {
        // Move to root node (which is the Shared AppState Node) and initialize this.clientsSequenceHelper
        const cursor = tree.forest.allocateCursor();
        moveToDetachedField(tree.forest, cursor);
        cursor.enterNode(0);
        this.clientsSequenceHelper = new SharedTreeSequenceHelper(
            tree,
            cursor.buildAnchor(),
            brand("clients"),
            this.editBuilderCallbacks,
        );
        cursor.free();

        // Create the initial JsonableTree for the new local client
        const initialClientJsonTree = this.makeClientInitialJsonTree(numBubbles);

        // Insert it the local client the shared tree
        this.clientsSequenceHelper.push(initialClientJsonTree);
        // Keep a reference to the local client inserted into the shared tree
        const newClientIndex = this.clientsSequenceHelper.length() - 1;
        console.log(`new client Index: ${newClientIndex}`);
        // this.localClient = new Client(
        //     tree,
        //     this.clientsSequenceHelper.getAnchor(newClientIndex),
        //     this.editBuilderCallbacks,
        // );
        this.localClientNode = new SharedTreeNodeHelper(
            tree,
            this.clientsSequenceHelper.getAnchor(newClientIndex),
            this.editBuilderCallbacks,
        );
        console.log(
            `created client with id ${this.localClient.clientId} and color ${this.localClient.color}`,
        );

        // this.applyEdits();
    }

    public get localClient() {
        return new Client(this.tree, this.localClientNode.anchor, this.editBuilderCallbacks);
    }

    public applyEdits() {
        this.tree.runTransaction((forest, editor) => {
            this.tree.context.prepareForEdit();
            this.editBuilderCallbacks.forEach((editCallback) => editCallback(editor));
            return TransactionResult.Apply;
        });
        this.editBuilderCallbacks.length = 0;
    }

    makeClientInitialJsonTree(numBubbles: number): JsonableTree {
        const clientInitialJsonTree: JsonableTree = {
            type: iClientSchema.name,
            fields: {
                clientId: [{ type: stringSchema.name, value: `${Math.random()}` }],
                color: [{ type: stringSchema.name, value: "red" }],
                bubbles: [],
            },
        };

        // create and add initial bubbles to initial client json tree
        for (let i = 0; i < numBubbles; i++) {
            // const bubble = makeBubble(this._width, this._height);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            clientInitialJsonTree.fields!.bubbles.push({
                type: iBubbleSchema.name,
                fields: {
                    x: [{ type: int32Schema.name, value: 10 }],
                    y: [{ type: int32Schema.name, value: 10 }],
                    r: [{ type: int32Schema.name, value: 10 }],
                    vx: [{ type: int32Schema.name, value: 10 }],
                    vy: [{ type: int32Schema.name, value: 10 }],
                },
            });
        }

        return clientInitialJsonTree;
    }

    public get clients() {
        return this.clientsSequenceHelper
            .getAll()
            .map((treeNode) => new Client(this.tree, treeNode.anchor, this.editBuilderCallbacks));
    }

    public get width() {
        return this._width;
    }
    public get height() {
        return this._height;
    }

    public setSize(width?: number, height?: number) {
        this._width = width ?? 640;
        this._height = height ?? 480;
    }

    public increaseBubbles() {
        console.log("about to increase bubble");
        // this.localClient.increaseBubbles(makeBubble(this._width, this._height));
        this.localClient.increaseBubbles({
            x: 10,
            y: 10,
            vx: 10,
            vy: 10,
            r: 10,
        });
        console.log("increased bubble");
    }

    public increaseBubblesT(bubble: { x: number; y: number; r: number; vx: number; vy: number }) {
        // console.log("about to increase bubble");
        // this.localClient.increaseBubbles(makeBubble(this._width, this._height));
        this.localClient.increaseBubbles(bubble);
        // console.log("increased bubble");
    }

    public decreaseBubbles() {
        // console.log("about to pop bubble");
        this.localClient.decreaseBubbles();
        // console.log("popped bubble");
    }
}
