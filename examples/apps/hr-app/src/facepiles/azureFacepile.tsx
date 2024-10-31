import React from "react";
import { AzureMember } from "@fluidframework/azure-client";
import {
	AvatarGroup,
	AvatarGroupItem,
	AvatarGroupPopover,
	Tooltip,
	partitionAvatarGroupItems,
} from "@fluentui/react-components";

export function AzureFacepile(props: { members: AzureMember[] }): JSX.Element {
	const { inlineItems, overflowItems } = partitionAvatarGroupItems({
		items: props.members,
	});

	return (
		<AvatarGroup size={40} className="pr-2">
			{inlineItems.map((member) => (
				<Tooltip content={member.name} key={member.id} relationship="description">
					<AvatarGroupItem name={member.name} key={member.id} />
				</Tooltip>
			))}
			{overflowItems && (
				<AvatarGroupPopover>
					{overflowItems.map((member) => (
						<AvatarGroupItem name={member.name} key={member.id} />
					))}
				</AvatarGroupPopover>
			)}
		</AvatarGroup>
	);
}
