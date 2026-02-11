import { projectResource } from '../resource';
import Z from 'zod';

export default projectResource
	.addOperation({
		name: 'Accept Invite',
		action: 'Accept an invite to a project',
		description: 'Accept a project invitation using an invitation token',
	})
	.withProperties({
		projectInviteId: {
			displayName: 'Project Invite ID',
			type: 'string',
			default: '',
		},
		invitationToken: {
			displayName: 'Invitation Token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { projectInviteId, invitationToken } = properties;

		return apiClient.request({
			path: `/project-invites/${projectInviteId}/actions/accept`,
			method: 'POST',
			requestSchema: Z.object({
				invitationToken: Z.string(),
			}),
			body: {
				invitationToken,
			},
		});
	});
