/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import { fail, strict as assert } from "assert";
import {
    FieldKinds,
    singleTextCursor,
    anchorSymbol,
    isUnwrappedNode,
    valueSymbol,
    getSchemaString,
} from "../../feature-libraries";
import { brand } from "../../util";
import { detachedFieldAsKey, EmptyKey, FieldKey, JsonableTree, rootFieldKey, symbolFromKey, TreeValue } from "../../tree";
import { TreeNavigationResult } from "../../forest";
import { ITestTreeProvider, TestTreeProvider } from "../utils";
import { ISharedTree } from "../../shared-tree";
import { TransactionResult } from "../../checkout";
import { fieldSchema, GlobalFieldKey, namedTreeSchema, SchemaData } from "../../schema-stored";
import { bubbleBenchAppStateJsonTree, bubbleBenchAppStateSchemaData, iBubbleSchema, int32Schema } from "./bubbleBenchAppStateSchema";
import { Bubble } from "./bubbleBench/Bubble";
import { Client } from "./bubbleBench/Client";

const globalFieldKey: GlobalFieldKey = brand("globalFieldKey");
const globalFieldKeySymbol = symbolFromKey(globalFieldKey);

describe("SharedTree", () => {
    it("reads only one node", async () => {
        // This is a regression test for a scenario in which a transaction would apply its delta twice,
        // inserting two nodes instead of just one
        const provider = await TestTreeProvider.create(1);
        provider.trees[0].runTransaction((f, editor) => {
            const writeCursor = singleTextCursor({ type: brand("LonelyNode") });
            editor.insert(
                {
                    parent: undefined,
                    parentField: detachedFieldAsKey(f.rootField),
                    parentIndex: 0,
                },
                writeCursor,
            );

            return TransactionResult.Apply;
        });

        const { forest } = provider.trees[0];
        const readCursor = forest.allocateCursor();
        const destination = forest.root(provider.trees[0].forest.rootField);
        const cursorResult = forest.tryMoveCursorTo(destination, readCursor);
        assert.equal(cursorResult, TreeNavigationResult.Ok);
        assert.equal(readCursor.seek(1), TreeNavigationResult.NotFound);
        readCursor.free();
        forest.forgetAnchor(destination);
    });

    it("can be connected to another tree", async () => {
        const provider = await TestTreeProvider.create(2);
        assert(provider.trees[0].isAttached());
        assert(provider.trees[1].isAttached());

        const value = "42";
        const expectedSchema = getSchemaString(testSchema);

        // Apply an edit to the first tree which inserts a node with a value
        initializeTestTreeWithValue(provider.trees[0], value);

        // Ensure that the first tree has the state we expect
        assert.equal(getTestValue(provider.trees[0]), value);
        assert.equal(getSchemaString(provider.trees[0].storedSchema), expectedSchema);
        // Ensure that the second tree receives the expected state from the first tree
        await provider.ensureSynchronized();
        assert.equal(getTestValue(provider.trees[1]), value);
        // Ensure second tree got the schema from initialization:
        assert.equal(getSchemaString(provider.trees[1].storedSchema), expectedSchema);
        // Ensure that a tree which connects after the edit has already happened also catches up
        const joinedLaterTree = await provider.createTree();
        assert.equal(getTestValue(joinedLaterTree), value);
        // Ensure schema catchup works:
        assert.equal(getSchemaString(provider.trees[1].storedSchema), expectedSchema);
    });

    it("can summarize and load", async () => {
        const provider = await TestTreeProvider.create(1);
        const [summarizingTree] = provider.trees;
        const summarize = await provider.enableManualSummarization();
        const value = 42;
        initializeTestTreeWithValue(summarizingTree, value);
        await summarize();
        await provider.ensureSynchronized();
        const loadingTree = await provider.createTree();
        assert.equal(getTestValue(loadingTree), value);
        assert.equal(getSchemaString(loadingTree.storedSchema), getSchemaString(testSchema));
    });

    describe("Editing", () => {
        it("can insert and delete a node", async () => {
            const value = "42";
            const provider = await TestTreeProvider.create(2);
            const [tree1, tree2] = provider.trees;

            // Insert node
            initializeTestTreeWithValue(tree1, value);

            await provider.ensureSynchronized();

            // Validate insertion
            assert.equal(getTestValue(tree2), value);

            // Delete node
            tree1.runTransaction((forest, editor) => {
                editor.delete(
                    {
                        parent: undefined,
                        parentField: detachedFieldAsKey(forest.rootField),
                        parentIndex: 0,
                    },
                    1,
                );
                return TransactionResult.Apply;
            });

            await provider.ensureSynchronized();

            assert.equal(getTestValue(tree1), undefined);
            assert.equal(getTestValue(tree2), undefined);
        });

        // TODO: Add global field representation in changesets and delta
        it.skip("can edit a global field", async () => {
            const provider = await TestTreeProvider.create(2);
            const [tree1, tree2] = provider.trees;

            // Insert root node
            initializeTestTreeWithValue(tree1, 42);

            // Insert child in global field
            tree1.runTransaction((forest, editor) => {
                const writeCursor = singleTextCursor({ type: brand("TestValue"), value: 43 });
                editor.insert(
                    {
                        parent: {
                            parent: undefined,
                            parentField: detachedFieldAsKey(forest.rootField),
                            parentIndex: 0,
                        },
                        parentField: globalFieldKeySymbol,
                        parentIndex: 0,
                    },
                    writeCursor,
                );

                return TransactionResult.Apply;
            });

            await provider.ensureSynchronized();

            // Validate insertion
            {
                const readCursor = tree2.forest.allocateCursor();
                const destination = tree2.forest.root(tree2.forest.rootField);
                const cursorResult1 = tree2.forest.tryMoveCursorTo(destination, readCursor);
                assert.equal(cursorResult1, TreeNavigationResult.Ok);
                const cursorResult2 = readCursor.down(globalFieldKeySymbol, 0);
                assert.equal(cursorResult2, TreeNavigationResult.Ok);
                const { value } = readCursor;
                assert.equal(value, 43);
                readCursor.free();
                tree2.forest.forgetAnchor(destination);
            }

            // Delete node
            tree2.runTransaction((forest, editor) => {
                editor.delete(
                    {
                        parent: {
                            parent: undefined,
                            parentField: detachedFieldAsKey(forest.rootField),
                            parentIndex: 0,
                        },
                        parentField: globalFieldKeySymbol,
                        parentIndex: 0,
                    },
                    1,
                );
                return TransactionResult.Apply;
            });

            await provider.ensureSynchronized();

            // Validate deletion
            {
                const readCursor = tree2.forest.allocateCursor();
                const destination = tree2.forest.root(tree2.forest.rootField);
                const cursorResult1 = tree2.forest.tryMoveCursorTo(destination, readCursor);
                assert.equal(cursorResult1, TreeNavigationResult.Ok);
                const cursorResult2 = readCursor.down(globalFieldKeySymbol, 0);
                assert.equal(cursorResult2, TreeNavigationResult.NotFound);
            }
        });

        it("can insert multiple nodes", async () => {
            const provider = await TestTreeProvider.create(2);
            const [tree1, tree2] = provider.trees;

            // Insert nodes
            tree1.runTransaction((forest, editor) => {
                editor.insert(
                    {
                        parent: undefined,
                        parentField: detachedFieldAsKey(forest.rootField),
                        parentIndex: 0,
                    },
                    singleTextCursor({ type: brand("Test"), value: 1 }),
                );
                return TransactionResult.Apply;
            });

            tree1.runTransaction((forest, editor) => {
                editor.insert(
                    {
                        parent: undefined,
                        parentField: detachedFieldAsKey(forest.rootField),
                        parentIndex: 1,
                    },
                    singleTextCursor({ type: brand("Test"), value: 2 }),
                );
                return TransactionResult.Apply;
            });

            await provider.ensureSynchronized();

            // Validate insertion
            {
                const readCursor = tree2.forest.allocateCursor();
                const destination = tree2.forest.root(tree2.forest.rootField);
                const cursorResult = tree2.forest.tryMoveCursorTo(destination, readCursor);
                assert.equal(cursorResult, TreeNavigationResult.Ok);
                assert.equal(readCursor.value, 1);
                assert.equal(readCursor.seek(1), TreeNavigationResult.Ok);
                assert.equal(readCursor.value, 2);
                assert.equal(readCursor.seek(1), TreeNavigationResult.NotFound);
                readCursor.free();
                tree2.forest.forgetAnchor(destination);
            }
        });
    });

    it("can edit using editable-tree", async () => {
        const provider = await TestTreeProvider.create(1);
        const [sharedTree] = provider.trees;

        // Currently EditableTree does not have a way to hold onto fields/sequences across edits, only nodes, so insert a node to get started.

        // Insert node
        initializeTestTreeWithValue(sharedTree, 1);

        // Locate node to edit using EditableTree API
        const editable = sharedTree.root;
        assert(isUnwrappedNode(editable));
        const anchor = editable[anchorSymbol];

        // Check value we will edit is what we initialized it to.
        assert.equal(editable[valueSymbol], 1);

        // Perform an edit
        sharedTree.runTransaction((forest, editor) => {
            // Perform an edit
            const path = sharedTree.locate(anchor) ?? fail("anchor should exist");
            sharedTree.context.prepareForEdit();
            editor.setValue(path, 2);

            // Check that the edit is reflected in the EditableTree
            assert.equal(editable[valueSymbol], 2);

            sharedTree.context.prepareForEdit();
            return TransactionResult.Apply;
        });

        // Check that the edit is reflected in the EditableTree after the transaction.
        assert.equal(editable[valueSymbol], 2);
    });

    it("bubbleBench tree creation", async () => {
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        const cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        const cursorResult = tree.forest.tryMoveCursorTo(destination, cursor);
        assert.equal(cursorResult, TreeNavigationResult.Ok);

        const widthFieldKey: FieldKey = brand("width");
        cursor.down(widthFieldKey, 0);
        assert.equal(cursor.value as number, 1920);

        // get an anchor to the current node 'width'
        const widthAnchor = cursor.buildAnchor();

        // Perform an edit
        tree.runTransaction((forest, editor) => {
            const path = tree.locate(widthAnchor) ?? fail("anchor should exist");
            tree.context.prepareForEdit();
            cursor.free();
            editor.setValue(path, 1000);
            return TransactionResult.Apply;
        });
        await provider.ensureSynchronized();

        const cursor2 = tree.forest.allocateCursor();
        tree.forest.tryMoveCursorTo(destination, cursor2);
        cursor2.down(widthFieldKey, 0);
        assert.equal(cursor2.value, 1000);
    });

    it("bubbleBench - increaseBubbles() with FieldKind.optional", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        let cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("simpleBubbles"), 0), TreeNavigationResult.Ok);
        const bubbleLength = cursor.length(EmptyKey);
        assert.equal(bubbleLength, 2); // confirm initial length is 2

        cursor.down(EmptyKey, 0)
        const bubblesAnchor = cursor.buildAnchor();

        tree.runTransaction((forest, editor) => {
            const path = tree.locate(bubblesAnchor) ?? fail("anchor should exist");
            tree.context.prepareForEdit();
            cursor.free();
            editor.insert(
                path,
                singleTextCursor({
                    type: iBubbleSchema.name,
                    fields: {
                        x: [{ type: int32Schema.name, value: 99 }],
                        y: [{ type: int32Schema.name, value: 99 }],
                        r: [{ type: int32Schema.name, value: 99 }],
                        vx: [{ type: int32Schema.name, value: 99 }],
                        vy: [{ type: int32Schema.name, value: 99 }],
                    }
                }),
            );
            return TransactionResult.Apply;
        });
        await provider.ensureSynchronized();

        cursor = tree.forest.allocateCursor();
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("simpleBubbles"), 0), TreeNavigationResult.Ok);
        const updatedBubbleLength = cursor.length(EmptyKey);
        assert.equal(updatedBubbleLength, bubbleLength + 1);
    });

    it("bubbleBench - increaseBubbles() with FieldKind.sequence", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        let cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        const bubbleLength = cursor.length(brand("bubbles"));
        assert.equal(bubbleLength, 2); // confirm initial length is 2
        assert.equal(cursor.down(brand("bubbles"), 0), TreeNavigationResult.Ok);
        const bubblesAnchor = cursor.buildAnchor();

        tree.runTransaction((forest, editor) => {
            const path = tree.locate(bubblesAnchor) ?? fail("anchor should exist");
            tree.context.prepareForEdit();
            cursor.free();
            editor.insert(
                path,
                singleTextCursor({
                    type: iBubbleSchema.name,
                    fields: {
                        x: [{ type: int32Schema.name, value: 99 }],
                        y: [{ type: int32Schema.name, value: 99 }],
                        r: [{ type: int32Schema.name, value: 99 }],
                        vx: [{ type: int32Schema.name, value: 99 }],
                        vy: [{ type: int32Schema.name, value: 99 }],
                    }
                }),
            );
            return TransactionResult.Apply;
        });
        await provider.ensureSynchronized();

        cursor = tree.forest.allocateCursor();
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        const updatedBubbleLength = cursor.length(brand("bubbles"));
        assert.equal(updatedBubbleLength, bubbleLength + 1);
    });

    it("bubbleBench - decreaseBubbles() with FieldKind.sequence", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        let cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        const bubbleLength = cursor.length(brand("bubbles"));
        assert.equal(bubbleLength, 2); // confirm initial length is 2
        assert.equal(cursor.down(brand("bubbles"), 0), TreeNavigationResult.Ok);
        const bubblesAnchor = cursor.buildAnchor();

        tree.runTransaction((forest, editor) => {
            const path = tree.locate(bubblesAnchor) ?? fail("anchor should exist");
            tree.context.prepareForEdit();
            cursor.free();
            editor.delete(path, 1); // "popping the first bubble in the array"
            return TransactionResult.Apply;
        });
        await provider.ensureSynchronized();

        cursor = tree.forest.allocateCursor();
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        const updatedBubbleLength = cursor.length(brand("bubbles"));
        assert.equal(cursor.down(brand("bubbles"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("x"), 0), TreeNavigationResult.Ok);
        const remainingBubbleX = cursor.value as number;
        assert.equal(updatedBubbleLength, bubbleLength - 1);
        assert.equal(remainingBubbleX, 20);
        cursor.free();
    });

    it("bubbleBench - Test Example: navigate to a to a bubble in a Fieldkind.sequence array in local client", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        const cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("bubbles"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand('x'), 0), TreeNavigationResult.Ok);
        const bubble1XVal = cursor.value as number;

        const cursor2 = tree.forest.allocateCursor();
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor2), TreeNavigationResult.Ok);
        assert.equal(cursor2.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor2.down(brand("bubbles"), 1), TreeNavigationResult.Ok);
        assert.equal(cursor2.down(brand("x"), 0), TreeNavigationResult.Ok);
        const bubble2XVal = cursor2.value as number;
    });

    it("bubbleBench - Test Example: navigate to a bubble in a Fieldkind.optional array in local client", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        const cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        const cursorResult = tree.forest.tryMoveCursorTo(destination, cursor);
        assert.equal(cursorResult, TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("simpleBubbles"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(EmptyKey, 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("x"), 0), TreeNavigationResult.Ok);
        const bubble1XVal = cursor.value as number;

        console.log('hello')
    });

    it("bubbleBench Bubble - get()", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        let cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        const cursorResult = tree.forest.tryMoveCursorTo(destination, cursor);
        assert.equal(cursorResult, TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("bubbles"), 0), TreeNavigationResult.Ok);

        const bubbleAnchor = cursor.buildAnchor();
        const bubble = new Bubble(tree, bubbleAnchor);

        // Confirm all value retrievals work
        cursor.down(Bubble.xFieldKey, 0);
        assert.strictEqual(bubble.x, cursor.value); // confirm the value is whats in the tree
        cursor.up();

        cursor.down(Bubble.yFieldKey, 0);
        assert.strictEqual(bubble.y, cursor.value);
        cursor.up();

        cursor.down(Bubble.rFieldKey, 0);
        assert.strictEqual(bubble.r, cursor.value);
        cursor.up();

        cursor.down(Bubble.vxFieldKey, 0);
        assert.strictEqual(bubble.vx, cursor.value);
        cursor.up();

        cursor.down(Bubble.vyFieldKey, 0);
        assert.strictEqual(bubble.vy, cursor.value);
        cursor.up();

        cursor.free();
        bubble.x = 99;
        await provider.ensureSynchronized();
        assert.strictEqual(bubble.x, 99);

        cursor = tree.forest.allocateCursor();
        tree.forest.tryMoveCursorTo(bubbleAnchor, cursor);
        cursor.down(Bubble.xFieldKey, 0);
        assert.strictEqual(bubble.x, cursor.value);
    });

    it("bubbleBench Bubble - set()", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        let cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        const cursorResult = tree.forest.tryMoveCursorTo(destination, cursor);
        assert.equal(cursorResult, TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("bubbles"), 0), TreeNavigationResult.Ok);

        const bubbleAnchor = cursor.buildAnchor();
        const bubble = new Bubble(tree, bubbleAnchor);
        cursor.free();

        // test if set() for x, y, vx, vy, r works
        const updatedXValue = bubble.x + 10;
        bubble.x = updatedXValue;
        await provider.ensureSynchronized();
        assert.strictEqual(bubble.x, updatedXValue);
        cursor = tree.forest.allocateCursor();
        tree.forest.tryMoveCursorTo(bubbleAnchor, cursor);
        cursor.down(Bubble.xFieldKey, 0);
        assert.strictEqual(bubble.x, cursor.value); // confirm the value is whats in the tree
        cursor.free();

        const updatedYValue = bubble.y + 10;
        bubble.y = updatedYValue;
        await provider.ensureSynchronized();
        assert.strictEqual(bubble.y, updatedYValue);
        cursor = tree.forest.allocateCursor();
        tree.forest.tryMoveCursorTo(bubbleAnchor, cursor);
        cursor.down(Bubble.yFieldKey, 0);
        assert.strictEqual(bubble.y, cursor.value);
        cursor.free();

        const updatedVxValue = bubble.vx + 10;
        bubble.vx = updatedVxValue;
        await provider.ensureSynchronized();
        assert.strictEqual(bubble.vx, updatedVxValue);
        cursor = tree.forest.allocateCursor();
        tree.forest.tryMoveCursorTo(bubbleAnchor, cursor);
        cursor.down(Bubble.vxFieldKey, 0);
        assert.strictEqual(bubble.vx, cursor.value);
        cursor.free();

        const updatedVyValue = bubble.vy + 10;
        bubble.vy = updatedVyValue;
        await provider.ensureSynchronized();
        assert.strictEqual(bubble.vy, updatedVyValue);
        cursor = tree.forest.allocateCursor();
        tree.forest.tryMoveCursorTo(bubbleAnchor, cursor);
        cursor.down(Bubble.vyFieldKey, 0);
        assert.strictEqual(bubble.vy, cursor.value);
        cursor.free();

        const updatedRValue = bubble.r + 10;
        bubble.r = updatedRValue;
        await provider.ensureSynchronized();
        assert.strictEqual(bubble.r, updatedRValue);
        cursor = tree.forest.allocateCursor();
        tree.forest.tryMoveCursorTo(bubbleAnchor, cursor);
        cursor.down(Bubble.rFieldKey, 0);
        assert.strictEqual(bubble.r, cursor.value);
        cursor.free();
    });

    it("bubbleBench Client - get()", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        const cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        const cursorResult = tree.forest.tryMoveCursorTo(destination, cursor);
        assert.equal(cursorResult, TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);

        const clientAnchor = cursor.buildAnchor();
        const client = new Client(tree, clientAnchor, 1920, 1080);

        // Confirm all value retrievals work
        cursor.down(Client.clientIdFieldKey, 0);
        assert.strictEqual(client.clientId, cursor.value); // confirm the value is whats in the tree
        cursor.up();

        cursor.down(Client.colorFieldKey, 0);
        assert.strictEqual(client.color, cursor.value);
        cursor.up();

        assert.equal(cursor.down(brand('bubbles'), 0), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand('x'), 0), TreeNavigationResult.Ok);
        assert.equal(client.bubbles[0].x, cursor.value);
        cursor.up();
        cursor.up();

        assert.equal(cursor.down(brand('bubbles'), 1), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand('x'), 0), TreeNavigationResult.Ok);
        assert.equal(client.bubbles[1].x, cursor.value);
        cursor.up();
        cursor.up();
        cursor.free();
    });

    it("bubbleBench Client - bubbleSeqeunceHelper.push()", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        let cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);

        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);

        const clientAnchor = cursor.buildAnchor();
        const client = new Client(tree, clientAnchor, 1920, 1080);
        const initialBubblesLength = client.bubbles.length;
        assert.equal(initialBubblesLength, cursor.length(brand('bubbles')));
        cursor.free();
        client.increaseBubbles();
        await provider.ensureSynchronized();

        const updatedBubblesLength = client.bubbles.length;
        assert.equal(updatedBubblesLength, initialBubblesLength + 1);
        cursor = tree.forest.allocateCursor();
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        assert.equal(updatedBubblesLength, cursor.length(brand('bubbles')));

        const newBubble = client.bubbles[client.bubbles.length - 1];
        const newBubbleXVal = newBubble.x;
        assert.equal(newBubbleXVal, 99);
    });

    it("bubbleBench Client - bubbleSeqeunceHelper.pop()", async () => {
        // Create tree
        const provider = await TestTreeProvider.create(1);
        const tree = await initializeSharedTree(provider, provider.trees[0], bubbleBenchAppStateSchemaData, bubbleBenchAppStateJsonTree);
        // Create cursor and move it to the root node of the tree
        let cursor = tree.forest.allocateCursor();
        const destination = tree.forest.root(tree.forest.rootField);
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);

        const clientAnchor = cursor.buildAnchor();
        const client = new Client(tree, clientAnchor, 1920, 1080);
        const initialBubblesLength = client.bubbles.length;
        assert.equal(initialBubblesLength, cursor.length(brand('bubbles')));
        cursor.free();
        client.decreaseBubbles();
        await provider.ensureSynchronized();

        const updatedBubblesLength = client.bubbles.length;
        assert.equal(updatedBubblesLength, initialBubblesLength - 1);
        cursor = tree.forest.allocateCursor();
        assert.equal(tree.forest.tryMoveCursorTo(destination, cursor), TreeNavigationResult.Ok);
        assert.equal(cursor.down(brand("localClient"), 0), TreeNavigationResult.Ok);
        const actalTreeBubblesLength = cursor.length(brand('bubbles'));
        assert.equal(updatedBubblesLength, actalTreeBubblesLength);

        const remainingBubble = client.bubbles[client.bubbles.length - 1];
        const remainingBubbleXVal = remainingBubble.x;
        assert.equal(remainingBubbleXVal, 10);
    });

    async function initializeSharedTree(provider: ITestTreeProvider, tree: ISharedTree,
        schemaData: SchemaData, data?: JsonableTree): Promise<ISharedTree> {
        assert(tree.isAttached());
        tree.storedSchema.update(schemaData);
        // assert(isEmptyTree(provider.trees[0].root)); Is okay to remove the check?
        if (data) {
            tree.runTransaction((forest, editor) => {
                const writeCursor = singleTextCursor(data);
                editor.insert(
                    {
                        parent: undefined,
                        parentField: detachedFieldAsKey(forest.rootField),
                        parentIndex: 0,
                    },
                    writeCursor,
                );
                return TransactionResult.Apply;
            });
        }
        await provider.ensureSynchronized();
        return tree;
    }

    const rootFieldSchema = fieldSchema(FieldKinds.value);
    const globalFieldSchema = fieldSchema(FieldKinds.value);
    const rootNodeSchema = namedTreeSchema({
        name: brand("TestValue"),
        extraLocalFields: fieldSchema(FieldKinds.sequence),
        globalFields: [globalFieldKey],
    });
    const testSchema: SchemaData = {
        treeSchema: new Map([[rootNodeSchema.name, rootNodeSchema]]),
        globalFieldSchema: new Map([
            [rootFieldKey, rootFieldSchema],
            [globalFieldKey, globalFieldSchema],
        ]),
    };

    /**
     * Inserts a single node under the root of the tree with the given value.
     * Use {@link getTestValue} to read the value.
     */
    function initializeTestTreeWithValue(tree: ISharedTree, value: TreeValue): void {
        tree.storedSchema.update(testSchema);

        // Apply an edit to the tree which inserts a node with a value
        tree.runTransaction((forest, editor) => {
            const writeCursor = singleTextCursor({ type: brand("TestValue"), value });
            editor.insert(
                {
                    parent: undefined,
                    parentField: detachedFieldAsKey(forest.rootField),
                    parentIndex: 0,
                },
                writeCursor,
            );

            return TransactionResult.Apply;
        });
    }

    /**
     * Reads a value in a tree set by {@link initializeTestTreeWithValue} if it exists.
     */
    function getTestValue({ forest }: ISharedTree): TreeValue | undefined {
        const readCursor = forest.allocateCursor();
        const destination = forest.root(forest.rootField);
        const cursorResult = forest.tryMoveCursorTo(destination, readCursor);
        if (cursorResult !== TreeNavigationResult.Ok) {
            return undefined;
        }
        const { value } = readCursor;
        readCursor.free();
        forest.forgetAnchor(destination);
        if (cursorResult === TreeNavigationResult.Ok) {
            return value;
        }

        return undefined;
    }
});
