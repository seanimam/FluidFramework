/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { Router } from "express";
import type { ITenantManager } from "@fluidframework/server-services-core";
// import { SummaryReader } from "@fluidframework/server-lambdas";
import { getParam } from "../../utils";

/**
 * Creates a set of API Routes related to Fluid Framework Summaries that are assigned to an {@link Router}
 * which can then be used with an Express server.
 */
export function create(tenantManager: ITenantManager): Router {
	const router: Router = Router();

	addGetSummaryRoute(router, tenantManager);

	return router;
}

/**
 * Adds API route to get the a summary for a given document, tenant id and git commit hash.
 * The git commit hash is effectively the UUID for a given summary.
 */
function addGetSummaryRoute(router: Router, tenantManager: ITenantManager) {
	// router.get("/:tenantId/:documentId", (request, response) => {
	// 	console.log("received summary get request");
	// 	const documentId = getParam(request.params, "documentId");
	// 	const tenantId = getParam(request.params, "tenantId");

	// 	const tenantManagerP = tenantManager.getTenant(tenantId, documentId);

	// 	tenantManagerP
	// 		.then((tenant) => {
	// 			if (tenant) {
	// 				console.log("obtained tenant", tenant);
	// 			}

	// 			const summaryReader = new SummaryReader(
	// 				tenantId,
	// 				documentId,
	// 				tenant.gitManager,
	// 				false,
	// 			);
	// 			console.log("created summaryReader", tenant);
	// 			const latestSummaryP = summaryReader.readLastSummary();

	// 			latestSummaryP
	// 				.then((summary) => {
	// 					if (summary) {
	// 						console.log("obtained summary");

	// 						if (summary?.scribe) {
	// 							const scribeMsgContent = JSON.parse(summary.scribe);
	// 							const validParentSummaries = scribeMsgContent.validParentSummaries;
	// 							if (validParentSummaries && validParentSummaries.length > 0) {
	// 								console.log(
	// 									"last valid parent summary hash:",
	// 									validParentSummaries[0],
	// 								);
	// 							}

	// 							const commitsP = tenant.gitManager.getCommits(documentId, 1);
	// 							commitsP
	// 								.then((resp) => {
	// 									console.log(
	// 										"obtained following data using doc id as commit",
	// 										resp,
	// 									);

	// 									if (resp) {
	// 										const treeHash = resp[0].commit?.tree?.sha;
	// 										console.log(`tree hash is ${treeHash}`);

	// 										const fullTreeP = tenant.gitManager.getTree(
	// 											treeHash,
	// 											true,
	// 										);

	// 										fullTreeP
	// 											.then((resp2) => {
	// 												console.log("obtained full tree: ", resp2);
	// 											})
	// 											.catch((error) => {
	// 												response.status(400).json(error);
	// 											});
	// 									}
	// 								})
	// 								.catch((error) => {
	// 									response.status(400).json(error);
	// 								});
	// 						}
	// 					} else {
	// 						console.log("no summary found!", summary);
	// 					}
	// 					response.status(200).json(summary);
	// 				})
	// 				.catch((error) => {
	// 					response.status(400).json(error);
	// 				});
	// 		})
	// 		.catch((error) => {
	// 			response.status(400).json(error);
	// 		});

	// 	// tenantManager
	// 	// 	.getTenant(getParam(request.params, "tenantId"), getParam(request.params, "documentId"))
	// 	// 	.then(async (tenant) => {
	// 	// 		const summary = await tenant.gitManager.getSummary(
	// 	// 			getParam(request.params, "gitCommitHash"),
	// 	// 		);
	// 	// 		response.status(200).json(summary);
	// 	// 	})
	// 	// 	.catch((error) => {
	// 	// 		response.status(400).json(error);
	// 	// 	});
	// });

	// cleaned up version
	router.get("/:tenantId/:documentId", (request, response) => {
		console.log("received summary get request");
		const documentId = getParam(request.params, "documentId");
		const tenantId = getParam(request.params, "tenantId");

		const tenantManagerP = tenantManager.getTenant(tenantId, documentId);

		tenantManagerP
			.then(async (tenant) => {
				const commits = await tenant.gitManager.getCommits(documentId, 1);
				const treeHash = commits[0].commit?.tree?.sha;
				console.log(" tenant.gitManager.getCommits(documentId, 1) returned:", commits);
				console.log(`Document git tree hash is ${treeHash}`);

				const fullTree = await tenant.gitManager.getTree(treeHash, true);
				console.log("obtained full tree: ", fullTree);

				const ddsData = {};
				for (const item of fullTree.tree) {
					if (item.path.startsWith(".channels") && item.type === "blob") {
						if (item.path.endsWith(".component")) {
							// Not sure what this data is supposed to be but it doesn't seem useful
							continue;
						}

						// 1. Identify UUID for the DDS
						let ddsCommitChannelId;
						const pathParts = item.path.split("/");
						if (pathParts.length > 3) {
							// the channel id exists within item.path and I think its like the uuid name for a folder in git for a given dds
							ddsCommitChannelId = pathParts[3];
							if (!ddsData[ddsCommitChannelId]) {
								ddsData[ddsCommitChannelId] = {};
							}
						} else {
							console.error(
								"Unable to identify which dds data belongs to due to missing channel id:",
								item,
							);
						}

						// 2. Decode blob contents
						const gitChannelData = await tenant.gitManager.getBlob(item.sha);
						const decodedCommitContents = atob(gitChannelData.content);

						// 3. Identify what type of information about the DDS this is
						if (item.path.endsWith("header")) {
							// This is the actual content in the DDS
							if (ddsCommitChannelId) {
								ddsData[ddsCommitChannelId].data = decodedCommitContents;
							}
						} else if (item.path.endsWith(".attributes")) {
							// This is the metadata about the DDS
							if (ddsCommitChannelId) {
								ddsData[ddsCommitChannelId].metadata = decodedCommitContents;
							}
						}
					}
				}

				const appData = { gitCommit: commits, ddsData };

				return response.status(200).json({
					appData,
				});
			})
			.catch((error) => {
				console.log(error);
				response.status(400).json(error);
			});
	});

	// router.get("/v2/:tenantId/:documentId", (request, response) => {
	// 	console.log("received v2 summary get request");
	// 	const documentId = getParam(request.params, "documentId");
	// 	const tenantId = getParam(request.params, "tenantId");

	// 	tenantManager
	// 		.getTenant(tenantId, documentId)
	// 		.then(async (tenant) => {
	// 			console.log("successfully retrieved tenant");
	// 			const existingRef = await tenant.gitManager.getRef(encodeURIComponent(documentId));
	// 			if (existingRef) {
	// 				const commitHash = existingRef.object.sha;
	// 				const summary = await tenant.gitManager.getSummary(commitHash);
	// 				response.status(200).json(summary);
	// 			}
	// 		})
	// 		.catch((error) => {
	// 			response.status(400).json(error);
	// 		});
	// });

	return router;
}
