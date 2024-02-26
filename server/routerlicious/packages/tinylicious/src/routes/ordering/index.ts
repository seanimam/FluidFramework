/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable-next-line import/no-deprecated
import { TypedEventEmitter } from "@fluidframework/common-utils";
import {
	IBroadcastSignalEventPayload,
	ICollaborationSessionEvents,
	IRoom,
	IRuntimeSignalEnvelope,
} from "@fluidframework/server-lambdas";
import {
	IDocumentStorage,
	MongoManager,
	type ITenantManager,
} from "@fluidframework/server-services-core";
import { Router } from "express";
import { Provider } from "nconf";
import { getParam } from "../../utils";
import * as deltas from "./deltas";
import * as documents from "./documents";
import * as summaries from "./summaries";

export function create(
	config: Provider,
	storage: IDocumentStorage,
	mongoManager: MongoManager,
	tenantManager: ITenantManager,
	// eslint-disable-next-line import/no-deprecated
	collaborationSessionEventEmitter?: TypedEventEmitter<ICollaborationSessionEvents>,
): Router {
	const router: Router = Router();
	const deltasRoute = deltas.create(config, mongoManager);
	const documentsRoute = documents.create(storage);
	const summariesRoute = summaries.create(tenantManager);

	router.use("/deltas", deltasRoute);
	router.use("/documents", documentsRoute);
	router.use("/summaries", summariesRoute);

	// Add a route here for /summary, we'll need this method to take the TenantManager as an arg.
	// Using the tenant manager, we can get access to Historian and GitManager which we can utilize to get the actually summary
	// The logic of which we will neatly put under a REST route, hopefully tenantManager.historian.getSummary will work..

	/**
	 * Passes on content to all clients in a collaboration session happening on the document via means of signal.
	 */
	router.post("/:tenantId/:id/broadcast-signal", (request, response) => {
		const tenantId = getParam(request.params, "tenantId");
		const documentId = getParam(request.params, "id");
		const signalContent = request?.body?.signalContent;
		if (!isValidSignalEnvelope(signalContent)) {
			response
				.status(400)
				.send(`signalContent should contain 'contents.content' and 'contents.type' keys.`);
			return;
		}
		if (!collaborationSessionEventEmitter) {
			response.status(500).send(`No emitter configured for the broadcast-signal endpoint.`);
			return;
		}

		try {
			const signalRoom: IRoom = { tenantId, documentId };
			const payload: IBroadcastSignalEventPayload = { signalRoom, signalContent };
			collaborationSessionEventEmitter.emit("broadcastSignal", payload);
			response.status(200).send("OK");
			return;
		} catch (error) {
			response.status(500).send(error);
			return;
		}
	});

	return router;
}

function isValidSignalEnvelope(
	input: Partial<IRuntimeSignalEnvelope>,
): input is IRuntimeSignalEnvelope {
	return typeof input?.contents?.type === "string" && input?.contents?.content !== undefined;
}
