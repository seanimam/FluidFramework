import {
	AvatarGroup,
	AvatarGroupItem,
	AvatarGroupPopover,
	Tooltip,
	partitionAvatarGroupItems,
} from "@fluentui/react-components";
import { OdspMember } from "@fluidframework/odsp-client/beta";
import React from "react";

export function SpeFacepile(props: { members: OdspMember[] }): JSX.Element {
	const { inlineItems, overflowItems } = partitionAvatarGroupItems({
		items: props.members,
	});

	return (
		<AvatarGroup size={40} className="pr-2">
			{inlineItems.map((member) => (
				<Tooltip
					content={`${member.name} - ${member.email}`}
					key={member.id}
					relationship="description"
				>
					<AvatarGroupItem name={`${member.name} - ${member.email}`} key={member.id} />
				</Tooltip>
			))}
			{overflowItems && (
				<AvatarGroupPopover>
					{overflowItems.map((member) => (
						<AvatarGroupItem
							name={`${member.name} - ${member.email}`}
							key={member.id}
						/>
					))}
				</AvatarGroupPopover>
			)}
		</AvatarGroup>
	);
}
