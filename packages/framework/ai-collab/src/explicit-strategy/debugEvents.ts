/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { v4 as uuidv4 } from "uuid";

import type { DebugEvent, EventFlowDebugEvent } from "../aiCollabApi.js";

import type { TreeEdit } from "./agentEditTypes.js";

/**
 * This file contains the types for the debug events that are emitted by the explicit strategy
 * as well as a helper functions to help create a consistent method for producing a base {@link DebugEvent}.
 *
 * **IMPORTANT**: If you change this file make sure the root README.md file is updated to reflect the changes.
 */

/**
 * A debug event for signaling the start of the ai-collab's core event loop.
 * Which makes various calls to the LLM to eventually apply edits to the users SharedTree which
 * accomplish the user's provided goal.
 * @alpha
 */
export interface CoreEventLoopStartedDebugEvent extends EventFlowDebugEvent {
	eventName: "CORE_EVENT_LOOP_STARTED";
	eventFlowName: "CORE_EVENT_LOOP";
	eventFlowStatus: "STARTED";
}

/**
 * A debug event for signaling the end of the ai-collab's core event loop.
 * There could be various reasons for the event loop to end, early exits and failures
 * which should be captured in the status and failureReason fields.
 * @alpha
 */
export interface CoreEventLoopCompletedDebugEvent extends EventFlowDebugEvent {
	eventName: "CORE_EVENT_LOOP_COMPLETED";
	eventFlowName: "CORE_EVENT_LOOP";
	eventFlowStatus: "COMPLETED";
	status: "success" | "failure";
	failureReason?: string;
	errorMessage?: string;
}

/**
 * ----------------------------------------------------------------------------------
 * Planning Prompt Debug events
 * ----------------------------------------------------------------------------------
 */

/**
 * A debug event marking the initiation of the flow for prompting an LLM to generate a plan for accomplishing the user's goal.
 * @alpha
 */
export interface PlanningPromptStartedDebugEvent extends EventFlowDebugEvent {
	eventName: "GENERATE_PLANNING_PROMPT_STARTED";
	eventFlowName: "GENERATE_PLANNING_PROMPT";
	eventFlowStatus: "STARTED";
}

/**
 * A debug event marking the completion of the flow for prompting an LLM to generate a plan for accomplishing the user's goal.
 * @alpha
 */
export interface PlanningPromptCompletedDebugEvent extends EventFlowDebugEvent {
	eventName: "GENERATE_PLANNING_PROMPT_COMPLETED";
	eventFlowName: "GENERATE_PLANNING_PROMPT";
	eventFlowStatus: "COMPLETED";
	/**
	 * Whether the response produced by the LLM was an expected response.
	 * In the event that the LLM fails to respond in an expected way, despite the API call to the LLM itself being successful, then this will be "failure".
	 *
	 * For now, this case is boxed to the LLM returning undefined as a response when it should have returned something. But in the future this could expand
	 * to things such as invalid json.
	 */
	requestOutcome: "success" | "failure";
	llmGeneratedPlan: string | undefined;
}

/**
 * ----------------------------------------------------------------------------------
 * Generate Tree Edit Debug events
 * ----------------------------------------------------------------------------------
 */

/**
 * A debug event marking the initiation of the flow for prompting an LLM to generate an edit to a SharedTree.
 * @alpha
 */
export interface GenerateTreeEditStartedDebugEvent extends EventFlowDebugEvent {
	eventName: "GENERATE_TREE_EDIT_STARTED";
	eventFlowName: "GENERATE_TREE_EDIT";
	eventFlowStatus: "STARTED";
	llmPrompt: string;
}

/**
 * A debug event marking the completion of the flow for prompting an LLM to generate an edit to a SharedTree.
 * @alpha
 */
export interface GenerateTreeEditCompletedDebugEvent extends EventFlowDebugEvent {
	eventName: "GENERATE_TREE_EDIT_COMPLETED";
	eventFlowName: "GENERATE_TREE_EDIT";
	eventFlowStatus: "COMPLETED";
	/**
	 * Whether the response produced by the LLM is an expected response.
	 * In the event that the LLM fails to respond in an expected way, despite the API call to the LLM itself being successful, then this will be "failure".
	 *
	 * For now, this case is boxed to the LLM returning undefined as a response when it should have returned something. But in the future this could expand
	 * to things such as invalid json.
	 */
	requestOutcome: "success" | "failure";
	/**
	 * This will be null if the LLM decides no more edits are necessary.
	 */
	// eslint-disable-next-line @rushstack/no-new-null
	llmGeneratedEdit?: TreeEdit | null;
}

/**
 * ----------------------------------------------------------------------------------
 * Apply Edit Debug events
 * ----------------------------------------------------------------------------------
 */

/**
 * A debug event marking the successful application of an LLM generated edit to a SharedTree.
 * @alpha
 */
export interface ApplyEditSuccessDebugEvent extends DebugEvent {
	eventName: "APPLIED_EDIT_SUCCESS";
	/**
	 * A unique id that will be shared across all debug events that are part of the same event flow.
	 */
	eventFlowTraceId?: string;
	/**
	 * The TreeEdit generated by the LLM.
	 */
	edit: TreeEdit;
}

/**
 * A debug event marking the failure of applying an LLM generated edit to a SharedTree.
 * @alpha
 */
export interface ApplyEditFailureDebugEvent extends DebugEvent {
	eventName: "APPLIED_EDIT_FAILURE";
	/**
	 * A unique id that will be shared across all debug events that are part of the same event flow.
	 */
	eventFlowTraceId?: string;
	/**
	 * The TreeEdit generated by the LLM.
	 */
	edit: TreeEdit;
	/**
	 * The error message that was thrown when attempting to apply the edit.
	 */
	errorMessage: string;
	/**
	 * The total number of sequential errors that have occurred up until this point, not including this error.
	 */
	sequentialErrorCount: number;
}

/**
 * ----------------------------------------------------------------------------------
 * Generate Final Review Debug events
 * ----------------------------------------------------------------------------------
 */

/**
 * A debug event marking the initiation of the flow for prompting an LLM to complete a final review of its edits
 * and determine whether the user's goal was accomplished.
 * @alpha
 */
export interface FinalReviewStartedDebugEvent extends EventFlowDebugEvent {
	eventName: "FINAL_REVIEW_STARTED";
	eventFlowName: "FINAL_REVIEW";
	eventFlowStatus: "STARTED";
	/**
	 * The prompt sent to the LLM to complete its final review of the edits its made.
	 */
	llmPrompt: string;
}

/**
 * A debug event marking the end of the flow for prompting an LLM to complete a final review of its edits
 * and determine whether the user's goal was accomplished.
 * @alpha
 */
export interface FinalReviewCompletedDebugEvent extends EventFlowDebugEvent {
	eventName: "FINAL_REVIEW_COMPLETED";
	eventFlowName: "FINAL_REVIEW";
	eventFlowStatus: "COMPLETED";
	/**
	 * Whether the response produced by the LLM was an expected response.
	 * In the event that the LLM fails to respond in an expected way, despite the API call to the LLM itself being successful, then this will be "failure".
	 *
	 * For now, this case is boxed to the LLM returning undefined as a response when it should have returned something. But in the future this could expand
	 * to things such as invalid json.
	 */
	status: "success" | "failure";
	/**
	 * The response from the LLM in regards to whether the user's goal was accomplished.
	 */
	llmReviewResponse?: {
		goalAccomplished: "yes" | "no";
	};
}

// Raw LLM Request/Response Debug Events ----------------------------------------------------------

/**
 * A debug event for an API call directly to a LLM.
 * @alpha
 */
export interface LlmApiCallDebugEvent extends DebugEvent {
	eventName: "LLM_API_CALL";
	/**
	 * The event flow name that made this LLM API call.
	 */
	triggeringEventFlowName?: "GENERATE_PLANNING_PROMPT" | "GENERATE_TREE_EDIT" | "FINAL_REVIEW";
	/**
	 * The unique id that will be shared across all debug events that are part of the same event flow.
	 * @remarks This can be used to correlate all debug events that are part of the same event flow.
	 */
	eventFlowTraceId?: string;
	/**
	 * The LLM model name that was used for the API call.
	 */
	modelName: string;
	/**
	 * The request parameters sent in the API call to the LLM.
	 */
	requestParams: unknown;
	/**
	 * The raw response from the LLM.
	 */
	response: unknown;
	/**
	 * The total number of tokens used in the API call to the LLM.
	 */
	tokenUsage?: {
		promptTokens: number;
		completionTokens: number;
	};
}

/**
 * Helper funciton to help create a consistent method for producing a base {@link DebugEvent}.
 */
export function generateDebugEvent(traceId?: string): DebugEvent {
	return {
		id: uuidv4(),
		traceId,
		timestamp: new Date().toISOString(),
	} as const;
}
