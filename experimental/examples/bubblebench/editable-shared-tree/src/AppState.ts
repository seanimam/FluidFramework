/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import { IAppState, makeBubble, randomColor } from "@fluid-example/bubblebench-common";
import { brand, EditableField, FieldKey, JsonableTree, singleTextCursor } from "@fluid-internal/tree";
import { Client } from "./Client";
import {
    AppStateTreeProxy,
    iBubbleSchema,
    iClientSchema,
    numberSchema,
    stringSchema,
} from "./schema";

export class AppState implements IAppState {
    static clientsFieldKey: FieldKey = brand("clients");
    readonly localClient: Client;

    constructor(
        private readonly appStateTreeProxy: AppStateTreeProxy,
        private _width: number,
        private _height: number,
        numBubbles: number,
    ) {
        const clientsSequenceNode = appStateTreeProxy[AppState.clientsFieldKey] as EditableField;
        const clientInitialJsonTree: JsonableTree = this.createClientInitialJsonTree(numBubbles);
        clientsSequenceNode.insertNodes(
            clientsSequenceNode.length,
            singleTextCursor(clientInitialJsonTree),
        );
        this.localClient = new Client(
            appStateTreeProxy.clients[appStateTreeProxy.clients.length - 1],
        );
        console.log(
            `created client with id ${this.localClient.clientId} and color ${this.localClient.color}`,
        );
    }

    public applyEdits() {}

    createClientInitialJsonTree(numBubbles: number): JsonableTree {
        const clientInitialJsonTree: JsonableTree = {
            type: iClientSchema.name,
            fields: {
                clientId: [{ type: stringSchema.name, value: `${Math.random()}` }],
                color: [{ type: stringSchema.name, value: randomColor() }],
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
                    x: [{ type: numberSchema.name, value: 10 }],
                    y: [{ type: numberSchema.name, value: 10 }],
                    r: [{ type: numberSchema.name, value: 10 }],
                    vx: [{ type: numberSchema.name, value: 10 }],
                    vy: [{ type: numberSchema.name, value: 10 }],
                },
            });
        }

        return clientInitialJsonTree;
    }

    public get clients() {
        return [...this.appStateTreeProxy.clients].map(
            (clientTreeProxy) => new Client(clientTreeProxy),
        );
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
        // console.log("about to increase bubble");
        this.localClient.increaseBubbles(makeBubble(this._width, this._height));
        // console.log("increased bubble");
    }

    public decreaseBubbles() {
        // console.log("about to pop bubble");
        this.localClient.decreaseBubbles();
        // console.log("popped bubble");
    }
}
