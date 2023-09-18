/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { Server } from "http";

import cors from "cors";
import express from "express";
import fetch, { Response } from "node-fetch";

import { delay } from "@fluidframework/core-utils";

import { initializeCustomerService } from "../src/mock-customer-service";
import { customerServicePort } from "../src/mock-customer-service-interface";
import { initializeExternalDataService, MockWebhook } from "../src/mock-external-data-service";
import { externalDataServicePort } from "../src/mock-external-data-service-interface";
import { ITaskData } from "../src/model-interface";
import { closeServer } from "./utilities";

const localServicePort = 5002;
const externalTaskListId = "task-list-1";

/**
 * Helper function for updating data within the external data service.
 * It also tests the response for a given code as well and will fail if it doesnt match.
 */
const updateExternalData = async (data: ITaskData, taskListId: string): Promise<Response> => {
	const dataUpdateResponse = await fetch(
		`http://localhost:${externalDataServicePort}/set-tasks/${taskListId}`,
		{
			method: "POST",
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				taskList: {
					...data,
				},
			}),
		},
	);

	return dataUpdateResponse;
};

/**
 * Helper function for registering a Fluid session with the customer service.
 */
const registerSessionWithCustomerService = async (
	taskListId: string,
	containerUrl: string,
): Promise<Response> => {
	const registerSessionUrl = await fetch(
		`http://localhost:${customerServicePort}/register-session-url`,
		{
			method: "POST",
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				externalTaskListId: taskListId,
				containerUrl,
			}),
		},
	);
	return registerSessionUrl;
};

/**
 * @remarks
 *
 * These tests spin up their own Express server instances so we can directly test against it
 * (using supertest), rather than leaning on network calls.
 */
describe("mock-customer-service", () => {
	/**
	 * Express server instance backing our mock external data service.
	 */
	let externalDataService: Server | undefined;

	/**
	 * Express server instance backing our mock customer service.
	 */
	let customerService: Server | undefined;

	/**
	 * Datastore mapping of external resource id to its subscribers.
	 *
	 * @defaultValue A new new map will be initialized.
	 */
	let webhookCollection: Map<string, MockWebhook<ITaskData>>;

	beforeEach(async () => {
		webhookCollection = new Map<string, MockWebhook<ITaskData>>();
		externalDataService = await initializeExternalDataService({
			port: externalDataServicePort,
			webhookCollection,
		});
		customerService = await initializeCustomerService({
			port: customerServicePort,
			externalDataServiceWebhookRegistrationUrl: `http://localhost:${externalDataServicePort}/register-for-webhook`,
			externalDataServiceWebhookUnregistrationUrl: `http://localhost:${externalDataServicePort}/unregister-webhook`,
			fluidServiceUrl: `http://localhost:${localServicePort}/broadcast-signal`,
		});
	});

	/* eslint-disable @typescript-eslint/no-non-null-assertion */

	afterEach(async () => {
		const _externalDataService = externalDataService!;
		const _customerService = customerService!;

		externalDataService = undefined;
		customerService = undefined;

		await closeServer(_externalDataService);
		await closeServer(_customerService);
	});

	// We have omitted `@types/supertest` due to cross-package build issue.
	// So for these tests we have to live with `any`.
	it("register-for-webhook: Complete data flow", async () => {
		// Set up mock local service, which will be registered as webhook listener
		const localServiceApp = express();
		localServiceApp.use(express.json());
		localServiceApp.use(cors());

		// Bind listener
		let wasFluidNotifiedForChange = false;
		let webhookChangeNotification;
		localServiceApp.post("/broadcast-signal", (request, result) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			webhookChangeNotification = request.body;
			wasFluidNotifiedForChange = true;
			result.send();
		});

		const localService: Server = localServiceApp.listen(localServicePort);

		try {
			// Register with the external service for notifications
			const webhookRegistrationResponse = await fetch(
				`http://localhost:${externalDataServicePort}/register-for-webhook`,
				{
					method: "POST",
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						url: `http://localhost:${localServicePort}/broadcast-signal?externalTaskListId=${externalTaskListId}`,
						externalTaskListId,
					}),
				},
			);

			if (!webhookRegistrationResponse.ok) {
				fail(`Webhook registration failed. Code: ${webhookRegistrationResponse.status}.`);
			}

			// Update external data
			const taskDataUpdate = {
				42: {
					name: "Determine the meaning of life",
					priority: 37,
				},
			};
			const dataUpdateResponse = await updateExternalData(taskDataUpdate, externalTaskListId);
			if (dataUpdateResponse.status !== 200) {
				fail(`Data update failed. Code: ${dataUpdateResponse.status}`);
			}

			// Delay for a bit to ensure time enough for our webhook listener to have been called.
			await delay(1000);

			// Verify our listener was notified of data change.
			expect(wasFluidNotifiedForChange).toBe(true);
			expect(webhookChangeNotification).toMatchObject({
				data: taskDataUpdate,
			});
		} catch (error) {
			fail(error);
		} finally {
			await closeServer(localService);
		}
	});
	/* eslint-enable @typescript-eslint/no-non-null-assertion */

	it("register-session-url: Complete data flow", async () => {
		// Set up mock local service, which will be registered as webhook listener
		const localServiceApp = express();
		localServiceApp.use(express.json());
		localServiceApp.use(cors());

		// Bind listener
		let webhookChangeNotification;
		localServiceApp.post("/broadcast-signal", (request, result) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			webhookChangeNotification = request.body;
			result.send();
		});

		const localService: Server = localServiceApp.listen(localServicePort);

		const containerUrl = "https://www.mockFluidFrameworkService.com/container1";

		try {
			// 1. Register Fluid container URL for notifications with the customer service
			const registerSessionUrl = await registerSessionWithCustomerService(
				externalTaskListId,
				containerUrl,
			);
			expect(registerSessionUrl.status).toBe(200);

			// 2. Update external data within the external data service,
			// which should relay the changes to the customer notification service.
			const taskDataUpdate = {
				42: {
					name: "Determine the meaning of life",
					priority: 37,
				},
			};
			const dataUpdateResponse = await updateExternalData(taskDataUpdate, externalTaskListId);
			if (dataUpdateResponse.status !== 200) {
				fail(`Data update failed. Code: ${dataUpdateResponse.status}`);
			}

			// Delay for a bit to ensure time enough for our webhook listener to have been called.
			await delay(1000);

			// Verify our listener was notified of data change.
			expect(webhookChangeNotification).toMatchObject({
				containerUrl,
				externalTaskListId,
				taskData: taskDataUpdate,
			});
		} catch (error) {
			fail(error);
		} finally {
			await closeServer(localService);
		}
	});

	it("events-listener: Complete data flow for session-end event", async () => {
		// Set up mock local service, which will be registered as webhook listener
		const localServiceApp = express();
		localServiceApp.use(express.json());
		localServiceApp.use(cors());

		// Bind listener
		let webhookChangeNotification;
		localServiceApp.post("/broadcast-signal", (request, result) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			webhookChangeNotification = request.body;
			result.send();
		});

		const localService: Server = localServiceApp.listen(localServicePort);

		const containerUrl = "https://www.mockFluidFrameworkService.com/container1";

		try {
			// 1. Register Fluid container URL for notifications with the customer service
			const registerSessionUrl = await registerSessionWithCustomerService(
				externalTaskListId,
				containerUrl,
			);
			expect(registerSessionUrl.status).toBe(200);

			// 2. Update external data within the external data service,
			// which should relay the changes to the customer notification service.
			const taskDataUpdate = {
				42: {
					name: "Determine the meaning of life",
					priority: 37,
				},
			};
			const dataUpdateResponse = await updateExternalData(taskDataUpdate, externalTaskListId);
			expect(dataUpdateResponse.status).toBe(200);

			// Delay for a bit to ensure time enough for our webhook listener to have been called.
			await delay(1000);
			// Verify our listener was notified of data change.
			expect(webhookChangeNotification).toMatchObject({
				containerUrl,
				externalTaskListId,
				taskData: taskDataUpdate,
			});
			// Set the webhookChangeNotification variable back to undefined.
			webhookChangeNotification = undefined;

			// 3. Tell the customer service that the session has ended, which should
			// unregister the outstanding webhook for the given container URL and task list id
			const sessionEndEventResponse = await fetch(
				`http://localhost:${customerServicePort}/events-listener`,
				{
					method: "POST",
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						type: "session-end",
						containerUrl,
					}),
				},
			);
			expect(sessionEndEventResponse.status).toBe(200);

			// 4. Update external data within the external data service,
			// which should relay the changes to the customer notification service.
			const taskDataUpdate2 = {
				42: {
					name: "Some other task name",
					priority: 52,
				},
			};
			const dataUpdateResponse2 = await updateExternalData(
				taskDataUpdate2,
				externalTaskListId,
			);
			expect(dataUpdateResponse2.status).toBe(200);

			// Delay for a bit to ensure time enough for our webhook listener to have been called.
			await delay(1000);
			// Verify that we did not recieve a new change notification
			expect(webhookChangeNotification).toBeUndefined();
		} catch (error) {
			fail(error);
		} finally {
			await closeServer(localService);
		}
	});
});
