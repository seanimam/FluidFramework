'use client';

import { editTask } from "@/actions/task";
import { branch, SharedTreeBranchManager, type Difference, type DifferenceChange } from "@fluid-experimental/fluid-llm"
import { SharedTreeEngineerList, SharedTreeTask, SharedTreeTaskGroup, type SharedTreeAppState } from "@/types/sharedTreeAppSchema";
import { TaskPriorities, TaskStatuses, type Task, type TaskPriority } from "@/types/task";
import { Tree, type TreeView } from "@fluidframework/tree";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Box, Button, Card, CircularProgress, Divider, FormControl, IconButton, InputLabel, MenuItem, Popover, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { LoadingButton } from '@mui/lab';
import React, { useEffect, useState } from "react";
import { useSharedTreeRerender } from "@/useSharedTreeRerender";
import { useSnackbar } from "notistack";

export function TaskCard(props: {
	sharedTreeBranch?: TreeView<typeof SharedTreeAppState>,
	branchDifferences?: Difference[],
	sharedTreeTaskGroup: SharedTreeTaskGroup,
	sharedTreeTask: SharedTreeTask,
}) {
	// if (props.branchDifferences) {
	// 	console.log(`Task id ${props.sharedTreeTask.id} recieved branchDifferences: `, props.branchDifferences);
	// }

	const { enqueueSnackbar } = useSnackbar();

	const [aiPromptPopoverAnchor, setAiPromptPopoverAnchor] = useState<HTMLButtonElement | null>(null);
	const [diffOldValuePopoverAnchor, setDiffOldValuePopoverAnchor] = useState<HTMLButtonElement | null>(null);
	const [diffOldValue, setDiffOldValue] = useState<React.ReactNode>();
	const [isAiTaskRunning, setIsAiTaskRunning] = useState<boolean>(false);

	useSharedTreeRerender({ sharedTreeNode: props.sharedTreeTask, logId: 'TaskCard' });

	const deleteTask = () => {
		const taskIndex = props.sharedTreeTaskGroup.tasks.indexOf(props.sharedTreeTask);
		console.log('initiated delete of task at index: ', taskIndex);
		props.sharedTreeTaskGroup.tasks.removeAt(taskIndex);
	};

	const task = props.sharedTreeTask;

	const fieldDifferences = { isNewCreation: false, changes: {} as Record<string, DifferenceChange> };
	for (const diff of props.branchDifferences ?? []) {
		if (diff.type === 'CHANGE') {
			fieldDifferences.changes[diff.path[diff.path.length - 1]] = diff;
		}
		if (diff.type === 'CREATE') {
			fieldDifferences.isNewCreation = true;
		}
	}

	return <Card sx={{
		p: 4, position: 'relative', width: '100%',
		backgroundColor: fieldDifferences.isNewCreation ? '#e4f7e8' : 'white'
	}} key={`${task.title}`}>

		{fieldDifferences.isNewCreation &&
			<Box component='span' sx={{ position: 'absolute', top: -15, left: -7.5 }}>
				<IconButton>
					<Icon icon='clarity:new-solid' width={45} height={45} color='blue' />
				</IconButton>
			</Box>
		}

		<Box component='span' sx={{ position: 'absolute', top: 0, right: 0 }}>
			<IconButton onClick={() => deleteTask()}>
				<Icon icon='zondicons:close-solid' width={20} height={20} />
			</IconButton>
		</Box>

		<Box mb={2}>
			<Stack direction='row' justifyContent='space-between' alignItems='center'>
				<Box>
					<Typography variant='h1' fontSize={24}>{task.title}</Typography>
					<Divider sx={{ fontSize: 12 }} />
				</Box>
				<Box>
					<Popover
						open={Boolean(aiPromptPopoverAnchor)}
						anchorEl={aiPromptPopoverAnchor}
						onClose={() => setAiPromptPopoverAnchor(null)}
						anchorOrigin={{
							vertical: 'top',
							horizontal: 'center',
						}}
						transformOrigin={{
							vertical: 'bottom',
							horizontal: 'center',
						}}
					>
						<Box
							component="form"
							sx={{ display: 'flex', width: '500px', alignItems: 'center', p: 2 }}
							onSubmit={async (e) => {
								e.preventDefault();
								const formData = new FormData(e.currentTarget);
								const query = formData.get('searchQuery') as string;
								console.log('evoking server action w/ query: ', query);
								setIsAiTaskRunning(true);
								enqueueSnackbar(
									`Copilot: I'm working on your request - "${query}"`,
									{ variant: 'info', autoHideDuration: 5000 }
								);
								const resp = await editTask({ ...task } as Task, query);
								setIsAiTaskRunning(false);
								enqueueSnackbar(
									`Copilot: I've completed your request - "${query}"`,
									{ variant: 'success', autoHideDuration: 5000 }
								);
								// METHOD 1: Overwrite the entire task object
								// if (resp.success) {
								// 	// We don't know what exactly changed, So we just update everything.
								// 	props.sharedTreeTask.description = resp.data.description;
								// 	props.sharedTreeTask.priority = resp.data.priority;
								// 	props.sharedTreeTask.status = resp.data.status
								// }

								// METHOD 2: Update only the changed fields using a merge function
								if (resp.success) {
									const branchManager = new SharedTreeBranchManager({ nodeIdAttributeName: 'id' });
									branchManager.merge(props.sharedTreeTask as unknown as Record<string, unknown>, resp.data as unknown as Record<string, unknown>);
								}

								// METHOD 3: Update only the changed fields into a new branch of the data
								// if (resp.success) {
								// 	const branchManager = new SharedTreeBranchManager({ nodeIdAttributeName: 'id' });
								// 	const { differences, newBranch, newBranchTargetNode } = branchManager.checkoutNewMergedBranch(props.sharedTreeBranch, [], resp.data as unknown as Record<string, unknown>);
								// 	// Do something with the new branch, like a preview.
								// 	console.log('newBranch: ', newBranch);
								// 	console.log('newBranchTargetNode: ', { ...newBranchTargetNode });
								// }
							}}
						>
							<TextField
								id="search-bar"
								name="searchQuery"
								label="Ask AI For Help"
								variant="outlined"
								size="small"
								sx={{ flexGrow: 1, marginRight: 1 }}
							/>

							<LoadingButton loading={isAiTaskRunning} type="submit" variant="contained" color="primary">
								Send
							</LoadingButton>
						</Box>
					</Popover>
					<Button
						size='small'
						variant='contained'
						color="primary"
						sx={{ minWidth: '40px', padding: '4px' }}
						onClick={(event) => setAiPromptPopoverAnchor(event.currentTarget)}
					>
						<Icon icon='octicon:copilot-16' width={20} height={20} />
					</Button>
				</Box>
			</Stack>
		</Box>

		<Popover
			open={Boolean(diffOldValuePopoverAnchor)}
			anchorEl={diffOldValuePopoverAnchor}
			onClose={() => setDiffOldValuePopoverAnchor(null)}
			anchorOrigin={{
				vertical: 'top',
				horizontal: 'center',
			}}
			transformOrigin={{
				vertical: 'bottom',
				horizontal: 'center',
			}}
		>
			<Card sx={{ p: 2 }}>
				<Stack direction={'column'} spacing={2} alignItems='center'>
					<Typography>
						<Box component='span' sx={{ fontWeight: 'bold' }}>
							{`Old Value: `}
						</Box>
						{diffOldValue}
					</Typography>
					<Button color='warning' variant="contained" size='small' sx={{ textTransform: 'none', maxWidth: '150px' }}>
						Take Old Value</Button>
				</Stack>
			</Card>
		</Popover>

		<Stack direction='row' sx={{ width: '100%' }} spacing={2}>
			<Stack sx={{ flexGrow: 1, direction: 'row' }}>
				<Stack direction='row'>
					<TextField
						id="input-description-label-id"
						label='Description'
						value={task.description}
						onChange={(e) => props.sharedTreeTask.description = e.target.value}
						sx={{ height: '100%', width: '100%' }}
						slotProps={{
							input: {
								multiline: true,
								sx: {
									alignItems: 'flex-start',
									backgroundColor: fieldDifferences.changes['description'] ? '#a4dbfc' : 'white'
								}
							},
							inputLabel: {
								sx: { fontWeight: 'bold' }
							}
						}}
					/>
					{fieldDifferences.changes['description'] &&
						<IconButton onClick={(event) => {
							setDiffOldValue(fieldDifferences.changes['description'].oldValue);
							setDiffOldValuePopoverAnchor(event.currentTarget)
						}}>
							<Icon icon='clarity:info-standard-line' width={20} height={20} />
						</IconButton>
					}
				</Stack>


			</Stack>

			<Stack spacing={1} minWidth={180}>
				<Stack direction='row' spacing={1} alignItems='center'>

					<FormControl fullWidth>
						<InputLabel id="select-priority-label-id">
							<Typography fontWeight='bold'>
								Priority
							</Typography>
						</InputLabel>
						<Select
							labelId="select-priority-label-id"
							id="select-priority-id"
							value={task.priority}
							label="Priority"
							onChange={(e) => {
								props.sharedTreeTask.priority = e.target.value as TaskPriority;
							}}
							inputProps={{
								sx: {
									backgroundColor: fieldDifferences.changes['priority'] ? '#a4dbfc' : 'white'
								}
							}}
							size="small"
						>
							<MenuItem value={TaskPriorities.LOW} key={TaskPriorities.LOW}>
								<Typography color='blue'> Low </Typography>
							</MenuItem>
							<MenuItem value={TaskPriorities.MEDIUM} color='orange' key={TaskPriorities.MEDIUM}>
								<Typography color='orange'> Medium </Typography>
							</MenuItem>
							<MenuItem value={TaskPriorities.HIGH} color='red' key={TaskPriorities.HIGH}>
								<Typography color='red'> High </Typography>
							</MenuItem>
						</Select>
					</FormControl>

					{fieldDifferences.changes['priority'] &&
						<IconButton onClick={(event) => {
							setDiffOldValue(fieldDifferences.changes['priority'].oldValue);
							setDiffOldValuePopoverAnchor(event.currentTarget)
						}}>
							<Icon icon='clarity:info-standard-line' width={20} height={20} />
						</IconButton>
					}
				</Stack>

				<Stack direction='row' spacing={1} alignItems='center'>

					<FormControl fullWidth>
						<InputLabel id="select-status-label-id">
							<Typography fontWeight='bold'>
								Status
							</Typography>
						</InputLabel>
						<Select
							labelId="select-status-label-id"
							id="select-status-id"
							value={task.status}
							label="Status"
							onChange={(e) => props.sharedTreeTask.status = e.target.value}
							size="small"
							inputProps={{
								sx: {
									backgroundColor: fieldDifferences.changes['status'] ? '#a4dbfc' : 'white'
								}
							}}
						>
							<MenuItem value={TaskStatuses.TODO} key={TaskStatuses.TODO}>
								<Typography> Todo </Typography>
							</MenuItem>
							<MenuItem value={TaskStatuses.IN_PROGRESS} color='orange' key={TaskStatuses.IN_PROGRESS}>
								<Typography color='blue'> In Progress </Typography>
							</MenuItem>
							<MenuItem value={TaskStatuses.DONE} color='red' key={TaskStatuses.DONE}>
								<Typography color='green'> Done </Typography>
							</MenuItem>
						</Select>
					</FormControl>
				</Stack>

				<Stack direction='row' spacing={1} alignItems='center'>
					<FormControl fullWidth>
						<InputLabel id="select-assignee-label-id">
							<Typography fontWeight='bold'>
								Assignee
							</Typography>
						</InputLabel>
						<Select
							labelId="select-assignee-label-id"
							id="select-assignee-id"
							value={task.assignee}
							label="Assignee"
							onChange={(e) => props.sharedTreeTask.assignee = e.target.value as string}
							size="small"
							inputProps={{
								sx: {
									backgroundColor: fieldDifferences.changes['assignee'] ? '#a4dbfc' : 'white'
								}
							}}
						>

							<MenuItem value={'UNASSIGNED'}>
								<Typography> Unassigned </Typography>
							</MenuItem>
							{
								props.sharedTreeTaskGroup.engineers.map(engineer =>
									<MenuItem value={engineer.name} key={engineer.id}>
										<Typography> {engineer.name} </Typography>
									</MenuItem>
								)
							}
						</Select>
					</FormControl>
					{fieldDifferences.changes['assignee'] &&
						<IconButton onClick={(event) => {
							setDiffOldValue(fieldDifferences.changes['assignee'].oldValue);
							setDiffOldValuePopoverAnchor(event.currentTarget)
						}}>
							<Icon icon='clarity:info-standard-line' width={20} height={20} />
						</IconButton>
					}
				</Stack>

				<Stack direction='row' spacing={1} alignItems='center'>
					<FormControl>
						<TextField
							id="input-assignee-label-id"
							label='Complexity'
							value={task.complexity}
							size="small"
							slotProps={{
								htmlInput: {
									sx: {
										backgroundColor: fieldDifferences.changes['complexity'] ? '#a4dbfc' : 'white'
									}
								}
							}}
						/>
					</FormControl>
				</Stack>
			</Stack>
		</Stack >
	</Card >;
}
