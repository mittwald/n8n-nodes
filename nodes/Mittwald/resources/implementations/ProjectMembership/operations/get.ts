import { projectMembershipResource } from '../resource';

export default projectMembershipResource
	.addOperation({
		name: 'Get',
		action: 'Get a project membership',
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
			method: 'GET',
		});
	});
