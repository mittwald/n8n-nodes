import { customerResource } from '../resource';

export default customerResource
	.addOperation({
		name: 'List',
		action: 'List customers',
		description: 'Get all customer profiles the authenticated user has access to',
	})
	.withProperties({
		role: {
			displayName: 'Role Filter',
			type: 'string',
			default: '',
			required: false,
			description:
				'Filter customers by role. Use a comma-separated list for multiple roles, such as owner,member.',
		},
		search: {
			displayName: 'Search',
			type: 'string',
			default: '',
			required: false,
			description: 'Search customer number, customer name, or customer ID',
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
