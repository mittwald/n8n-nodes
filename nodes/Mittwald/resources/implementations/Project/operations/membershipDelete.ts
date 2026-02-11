import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Delete Membership',
		action: 'Delete a project membership',
		description: 'Remove a member from a project',
	})
	.withProperties({
		projectMembershipId: {
			displayName: 'Project Membership ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { projectMembershipId } = properties;

		return apiClient.request({
			path: `/project-memberships/${projectMembershipId}`,
			method: 'DELETE',
		});
	});
