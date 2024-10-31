/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TreeViewConfiguration, SchemaFactory, Tree } from "fluid-framework";

// Define a schema factory that is used to generate classes for the schema
const sf = new SchemaFactory("ef0b8eff-2876-4801-9b6a-973f09aab904");

export class Availability extends sf.array("Availability", sf.string) {}

export class OnSiteSchedule extends sf.object("OnSiteSchedule", {
	day: sf.required(sf.string, {
		metadata: {
			description:
				"The day of the week that the candidate is scheduled for an onsite interview. This field is required. Candidate and interviewers should be available on the day of the onsite interview.",
		},
	}),
	interviewerIds: sf.required(sf.array(sf.string), {
		metadata: {
			description:
				"The interviewerId of interviewers part of the onsite. This field is required. The default is an empty array. There have to be 3 interviewers for each onsite interview. The ids in this array should map to interviewerId field in Interviewer object",
		},
	}),
	candidateId: sf.required(sf.string, {
		metadata: {
			description:
				"The candidateId of the candidate that is scheduled for an onsite interview. This field is required. The candidateId should map to the id field in the Candidate object",
		},
	}),
}) {}

export class Interviewer extends sf.object("Interviewer", {
	role: sf.string,
	interviewerId: sf.required(sf.string, {
		metadata: {
			description:
				"The unique identifier of the interviewer. This field is required. This field is used to cross identify and reference the interviewer in the OnSiteSchedule",
		},
	}),
	name: sf.required(sf.string, {
		metadata: {
			description: "The name of the interviewer. This field is required.",
		},
	}),
	availability: sf.required(Availability, {
		metadata: {
			description: "The availability of the interviewer. This field is required.",
		},
	}),
}) {}

export class Candidate extends sf.object("Candidate", {
	name: sf.string,
	candidateId: sf.required(sf.string, {
		metadata: {
			description:
				"The unique identifier of the candidate. This field is required. This field is used to cross identify and reference the candidate in the OnSiteSchedule.",
		},
	}),
	yearsOfExperience: sf.number,
	availability: sf.required(Availability, {
		metadata: {
			description:
				"The availability of the candidate. This field is required. The default is an empty array." +
				"For this field, the only allowed values are the strings Monday,Tuesday,Wednesday,Thursday,Friday",
		},
	}),
	// onsiteInterviewDay: sf.required(sf.string, {
	// 	metadata: {
	// 		description: `The day of the week that the candidate is scheduled for an onsite interview. This field is required.
	// 	 For this field, the only allowed values are the strings "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" or "". The default value is empty string.
	// 	 The candidate should be available on the day of the onsite interview, this is determined by the candidateAvailability field.`,
	// 	},
	// }),
	// onsiteInterviewerIds: sf.required(sf.array(sf.string), {
	// 	metadata: {
	// 		description: `The name of interviewers part of the onsite. This field is required. The default is an empty array.
	// 	 For this field, the only allowed values are the strings that allow to uniquely identify an interviewer by their id.
	// 	 The value should only be the interviewerName of an interviewer object`,
	// 	},
	// }),
}) {}

export class Job extends sf.object("Job", {
	jobId: sf.string,
	jobState: sf.required(sf.string, {
		metadata: {
			description: `The job state of the job. This field is required. For this field, the only allowed values are the strings "open", "closed", "draft". The default is "draft"`,
		},
	}),
	jobTitle: sf.required(sf.string, {
		metadata: {
			description: `The title of the job. This field is required. Titles are short and clear`,
		},
	}),
	jobDescription: sf.required(sf.string, {
		metadata: {
			description: `The description of the job. This field is required. For this field include a brief description of the job.`,
		},
	}),
	candidates: sf.required(sf.array(Candidate), {
		metadata: {
			description: `The candidates who have applied for this job. This field is required. The default is an empty array. The objects of type Candidate are put in arrays here.`,
		},
	}),
	onSiteSchedule: sf.required(sf.array(OnSiteSchedule), {
		metadata: {
			description: `The schedule of the onsite interviews. This field is required. The default is an empty array. The objects of type OnSiteSchedule are put in arrays here.`,
		},
	}),
}) {
	public readonly delete = () => {
		const parent = Tree.parent(this);
		// Use type narrowing to ensure that parent is Items as expected for a note.
		if (Tree.is(parent, JobsArray)) {
			const index = parent.indexOf(this);
			parent.removeAt(index);
		}
	};
}

export class JobsArray extends sf.array("JobsArray", Job) {}

export class HRData extends sf.object("HRData", {
	jobsList: JobsArray,
	interviewerPool: sf.required(sf.array(Interviewer), {
		metadata: {
			description: `The interviewers who have been allowed to interview candidates that have applied to this role.
				This field is required. The default is an empty array. The objects of type Interviewer are put in arrays here.
				Interviewers should not be removed from this array.`,
		},
	}),
}) {}

export const treeConfiguration = new TreeViewConfiguration({ schema: HRData });
