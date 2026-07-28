import { organisationResource } from '../resource';

export default organisationResource
	.addOperation({
		name: 'List',
		action: 'List organisations',
		description: 'Get all organisations the authenticated user has access to',
	})
	.withProperties({
		role: {
			displayName: 'Role',
			type: 'multiOptions',
			default: [],
			required: false,
			options: [
				{
					name: 'Owner',
					value: 'owner',
				},
				{
					name: 'Member',
					value: 'member',
				},
				{
					name: 'Accountant',
					value: 'accountant',
				},
				{
					name: 'Not Set',
					value: 'notset',
				},
			],
			description: 'Only return organisations in which the user holds one of these roles',
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
				role: role.length > 0 ? role.join(',') : undefined,
				search: search || undefined,
			},
		});
	});
