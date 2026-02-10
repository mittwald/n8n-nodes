import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'membership-delete',
		action: 'Delete a project membership',
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
