import { organisationResource } from '../resource';

export default organisationResource
	.addOperation({
		name: 'List',
		action: 'List organisations',
		description: 'Get all organisations the authenticated user has access to',
	})
	.withProperties({
		role: {
			displayName: 'Role Filter',
			type: 'string',
			default: '',
			required: false,
			description:
				'Filter organisations by role. Use a comma-separated list for multiple roles, such as owner,member.',
		},
		search: {
			displayName: 'Search',
			type: 'string',
			default: '',
			required: false,
			description: 'Search organisation number, organisation name, or organisation ID',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { role, search } = properties;

		return apiClient.request({
			path: '/customers',
			method: 'GET',
			qs: {
				role: role || undefined,
				search: search || undefined,
			},
		});
	});
