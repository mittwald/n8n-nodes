import { projectResource } from '../resource';

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
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { projectInviteId } = properties;

		return apiClient.request({
			path: `/project-invites/${projectInviteId}/actions/accept`,
			method: 'POST',
		});
	});
