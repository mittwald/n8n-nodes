import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'DeleteMembership',
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

		return await apiClient.request({
			path: `/project-memberships/${projectMembershipId}`,
			method: 'DELETE',
		});
	});
