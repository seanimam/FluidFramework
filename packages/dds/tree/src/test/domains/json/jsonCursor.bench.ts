/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "assert";
import { benchmark, BenchmarkType, isInPerformanceTestingMode } from "@fluid-tools/benchmark";
import { Jsonable } from "@fluidframework/datastore-definitions";
import { makeRandom, PerformanceMarkovChain, SpaceEfficientMarkovChain } from "@fluid-internal/stochastic-test-utils";
import { buildForest, ITreeCursor, jsonableTreeFromCursor, singleTextCursor } from "../../..";
import { initializeForest, TreeNavigationResult } from "../../../forest";
// Allow importing from this specific file which is being tested:
/* eslint-disable-next-line import/no-internal-modules */
import { cursorToJsonObject, JsonCursor } from "../../../domains/json/jsonCursor";
import { generateCanada } from "./canada";
import { generateTwitterJsonByByteSize, isEscapeChar, miniTwitterJson,
     parseTwitterStatusesSentences, parseTwitterStatusesSentencesClassic, twitterRawJson } from "./twitter";
import { buildTextFromMarkovChain, buildTextFromMarkovChainV2, buildTextFromMarkovChainV3,
    getSizeInBytes, markovChainBuilder, markovChainBuilderV2 } from "./jsonGeneratorUtils";

// IIRC, extracting this helper from clone() encourages V8 to inline the terminal case at
// the leaves, but this should be verified.
function cloneObject<T, J = Jsonable<T>>(obj: J): J {
    if (Array.isArray(obj)) {
        // PERF: 'Array.map()' was ~44% faster than looping over the array. (node 14 x64)
        return obj.map(clone) as unknown as J;
    } else {
        const result: any = {};
        // PERF: Nested array allocs make 'Object.entries()' ~2.4x slower than reading
        //       value via 'value[key]', even when destructuring. (node 14 x64)
        for (const key of Object.keys(obj)) {
            result[key] = clone((obj as any)[key]);
        }
        return result as J;
    }
}

// Optimized deep clone implementation for "Jsonable" object trees.  Used as a real-world-ish
// baseline to measure the overhead of using ITreeCursor in a scenario where we're reifying a
// domain model for the application.
function clone<T>(value: Jsonable<T>): Jsonable<T> {
    // PERF: Separate clone vs. cloneObject yields an ~11% speedup in 'canada.json',
    //       likely due to inlining short-circuiting recursing at leaves (node 14 x64).
    return typeof value !== "object" || value === null
        ? value
        : cloneObject(value);
}

// Helper that measures an optimized 'deepClone()' vs. using ITreeCursor to extract an
// equivalent clone of the source data.
function bench(name: string, getJson: () => any) {
    const json = getJson();
    const encodedTree = jsonableTreeFromCursor(new JsonCursor(json));

    benchmark({
        type: BenchmarkType.Measurement,
        title: `Direct: '${name}'`,
        before: () => {
            const cloned = clone(json);
            assert.deepEqual(cloned, json,
                "clone() must return an equivalent tree.");
            assert.notEqual(cloned, json,
                "clone() must not return the same tree instance.");
        },
        benchmarkFn: () => {
            clone(json);
        },
    });

    const cursorFactories: [string, () => ITreeCursor][] = [
        ["JsonCursor", () => new JsonCursor(json)],
        ["TextCursor", () => singleTextCursor(encodedTree)],
        ["object-forest Cursor", () => {
            const forest = buildForest();
            initializeForest(forest, [encodedTree]);
            const cursor = forest.allocateCursor();
            assert.equal(forest.tryMoveCursorTo(forest.root(forest.rootField), cursor), TreeNavigationResult.Ok);
            return cursor;
        }],
    ];

    const consumers: [string, (cursor: ITreeCursor) => void][] = [
        ["cursorToJsonObject", cursorToJsonObject],
        ["jsonableTreeFromCursor", jsonableTreeFromCursor],
    ];

    for (const [consumerName, consumer] of consumers) {
        for (const [factoryName, factory] of cursorFactories) {
            let cursor: ITreeCursor;
            benchmark({
                type: BenchmarkType.Measurement,
                title: `${consumerName}(${factoryName}): '${name}'`,
                before: () => {
                    cursor = factory();
                    assert.deepEqual(cursorToJsonObject(cursor), json, "data should round trip through json");
                    assert.deepEqual(
                        jsonableTreeFromCursor(cursor), encodedTree, "data should round trip through jsonable");
                },
                benchmarkFn: () => {
                    consumer(cursor);
                },
            });
        }
    }
}

const canada = generateCanada(
    // Use the default (large) data set for benchmarking, otherwise use a small dataset.
    isInPerformanceTestingMode
        ? undefined
        : [2, 10]);

// The original benchmark twitter.json is 466906 Bytes according to getSizeInBytes.
const twitter = generateTwitterJsonByByteSize(isInPerformanceTestingMode ? 2500000 : 466906, true, true);
describe("ITreeCursor", () => {
    // const sentences = [
    //     ["hello", "my", "freind"],
    //     ["hello", "my", "friend", "daniel"],
    //     ["hello", "you", "my", "friend"],
    // ];

    // const chain = markovChainBuilder(sentences);
    // const sentence = buildTextFromMarkovChain(chain, makeRandom(), 4);

    const parsedSentences = parseTwitterStatusesSentences(twitterRawJson());
    const twitterMarkovChainWordBased = markovChainBuilderV2(parsedSentences);
    const twitterWordMarkovSize = getSizeInBytes(JSON.stringify(Array.from(twitterMarkovChainWordBased.entries())));
    const twitterSentence = buildTextFromMarkovChainV2(twitterMarkovChainWordBased, makeRandom(), 20);

    const parsedSentencesClassic = parseTwitterStatusesSentencesClassic(twitterRawJson());
    const twitterMarkovChainClassic = markovChainBuilder(parsedSentencesClassic);
    const twitterSentenceClassic = buildTextFromMarkovChainV3(twitterMarkovChainClassic, makeRandom());
    const twitterClassicMarkovSize = getSizeInBytes(JSON.stringify(Array.from(twitterMarkovChainClassic.entries())));


    const performanceMarkovChain = new PerformanceMarkovChain(makeRandom());
    console.time("performanceMarkovChain.initialize()");
    performanceMarkovChain.initialize(parsedSentencesClassic);
    console.timeEnd("performanceMarkovChain.initialize()");
    const performanceSentence = performanceMarkovChain.generateSentence();
    const performanceMarkovChainSize =
    getSizeInBytes(JSON.stringify(Array.from(performanceMarkovChain.chain.entries())));


    const spaceEfficientMarkovChain = new SpaceEfficientMarkovChain(makeRandom());
    console.time("spaceEfficientMarkovChain.initialize()");
    spaceEfficientMarkovChain.initialize(parsedSentencesClassic);
    console.timeEnd("spaceEfficientMarkovChain.initialize()");
    const spaceEfficientSentence = spaceEfficientMarkovChain.generateSentence();
    const chainMapArr = [];
    Array.from(spaceEfficientMarkovChain.chain.entries()).forEach((array) => {
        chainMapArr.push([array[0], Array.from(array[1].entries())]);
    });
    const spaceEfficientMarkovChainSize = getSizeInBytes(chainMapArr);

    bench("canada", () => canada);
    bench("twitter", () => twitter);
});
