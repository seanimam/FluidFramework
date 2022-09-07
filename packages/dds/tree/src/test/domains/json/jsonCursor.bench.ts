/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "assert";
import { benchmark, BenchmarkType, isInPerformanceTestingMode } from "@fluid-tools/benchmark";
import { Jsonable } from "@fluidframework/datastore-definitions";
import { buildForest, ITreeCursor, jsonableTreeFromCursor, singleTextCursor, jsonTypeSchema } from "../../..";
import { initializeForest, TreeNavigationResult } from "../../../forest";
// Allow importing from this specific file which is being tested:
/* eslint-disable-next-line import/no-internal-modules */
import { cursorToJsonObject, JsonCursor } from "../../../domains/json/jsonCursor";
import { defaultSchemaPolicy } from "../../../feature-libraries";
import { SchemaData, StoredSchemaRepository } from "../../../schema-stored";
import { generateCanada } from "./canada";
import { generateTwitterJsonByByteSize } from "./twitter";
import { citmRawJson, generateCitmJson } from "./citmCatalog";
import { getRandomEnglishString, getSizeInBytes } from "./jsonGeneratorUtils";
import { IRandom, makeRandom } from "@fluid-internal/stochastic-test-utils";

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
    const schemaData: SchemaData = {
        globalFieldSchema: new Map(),
        treeSchema: jsonTypeSchema,
    };
    const schema = new StoredSchemaRepository(defaultSchemaPolicy, schemaData);

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
            const forest = buildForest(schema);
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
const twitter = generateTwitterJsonByByteSize(isInPerformanceTestingMode ? 2500000 : 466906, true);
describe("ITreeCursor", () => {
    // const citm = generateCitmJson(makeRandom(), 1);
    const citm = citmRawJson();
    const rawSize = getSizeInBytes(citm) / 1000;
    const genereatedCitm = generateCitmJson(makeRandom(), 1, rawSize);

    const names = new Set<any>();
    const seatMapImage = new Set<any>();
    let priceMin = 99999999999999;
    let priceMax = -99999999999999;
    let priceCountMin = 99999999999999;
    let priceCountMax = -99999999999999;
    let areaIdsMin = 99999999999999;
    let areaIdsMax = -99999999999999;
    citm.performances.forEach((performance) => {
        performance.prices.forEach((price) => {
            priceMin = Math.min(priceMin, price.amount);
            priceMax = Math.max(priceMax, price.amount);
        });
        priceCountMin = Math.min(priceCountMin, performance.prices.length);
        priceCountMax = Math.max(priceCountMax, performance.prices.length);

        performance.seatCategories.forEach((seatCategory) => {
            areaIdsMin = Math.min(areaIdsMin, seatCategory.areas.length);
            areaIdsMax = Math.max(areaIdsMax, seatCategory.areas.length);
        });
        seatMapImage.add(performance.seatMapImage);
        names.add(performance.name);
    });

    bench("canada", () => canada);
    bench("twitter", () => twitter);
});
