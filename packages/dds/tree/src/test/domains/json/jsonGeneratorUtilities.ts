/**
 * This file contains a series of utility functions intended to assist with generating random data.
 */

export function getRandomStringInRange(numbersOnly: boolean, minLen: number, maxLen: number) {
    if (numbersOnly) {
        return Math.random().toString().substring(2, getRandomNumberInRange(minLen, maxLen));
    } else {
        return Math.random().toString(16).substring(2, getRandomNumberInRange(minLen, maxLen));
    }
}

export function getRandomString(numbersOnly: boolean, length: number) {
    return getRandomStringInRange(numbersOnly, length, length);
}

// source: https://stackoverflow.com/questions/19448680/how-to-get-a-random-character-from-a-range-in-javascript#
// :~:text=You%20can%20do%20this%20%3A,(0x30FF%2D0x30A0%2B1))%3B
export function getRandomUnicodeStringInRange(min: number, max: number) {
    let stringLength = min;
    if (min < max) {
        stringLength = getRandomNumberInRange(min, max);
    }
    let string = "";
    for (let i = 0; i < stringLength; i++) {
        string += String.fromCharCode(0x30A0 + Math.random() * (0x30FF - 0x30A0 + 1));
    }
    return string;
}

export function getRandomUnicodeString(length: number) {
    return getRandomUnicodeStringInRange(length, length);
}

export function getRandomNumberInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function getRandomBoolean() {
    return Math.random() === 1 ? true : false;
}

export function getSizeInBytes(obj: unknown) {
    let str = null;
    if (typeof obj === "string") {
        str = obj;
    } else {
        str = JSON.stringify(obj);
    }
    // Get the length of the Uint8Array
    const bytes = new TextEncoder().encode(str).length;
    return bytes;
}
