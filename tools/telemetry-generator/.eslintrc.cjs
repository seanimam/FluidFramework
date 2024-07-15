/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
	extends: [require.resolve("@fluidframework/eslint-config-fluid"), "prettier"],
	parserOptions: {
		project: ["./tsconfig.json"],
	},
	rules: {
		// TODO: remove these overrides and fix violations
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-unsafe-assignment": "off",
		"@typescript-eslint/no-unsafe-call": "off",
		"@typescript-eslint/no-unsafe-member-access": "off",
		"@typescript-eslint/no-unsafe-argument": "off",
		"unicorn/prefer-module": "off",

		// This package is exclusively used in a Node.js context
		"import/no-nodejs-modules": "off",
	},
};
