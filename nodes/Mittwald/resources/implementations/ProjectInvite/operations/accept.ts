import { projectInviteResource } from '../resource';

export default projectInviteResource
	.addOperation({
		name: 'Accept',
		action: 'Accept a invite to a project',
	})
	.withProperties({
		projectInviteId: {
			displayName: 'Project Invite ID',
			name: 'projectInviteId',
			type: 'string',
			default: '',
		},
		invitationToken: {
			displayName: 'Invitation Token',
			name: 'invitationToken',
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
			body: {
				invitationToken,
			},
		});
	});
