import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Delete',
		action: 'Delete a domain',
		description:
			'Delete a domain. This cannot be undone — to withdraw a deletion before it happens, schedule it instead.',
	})
	.withProperties({
		domainId: {
			displayName: 'Domain ID',
			description: 'The unique identifier of the domain',
			type: 'string',
			default: '',
			required: true,
		},
		transit: {
			displayName: 'Transit',
			description:
				'Whether to hand the domain over to the registry for transfer instead of deleting it outright',
			type: 'boolean',
			default: false,
		},
		deleteIngresses: {
			displayName: 'Delete Ingresses',
			description: 'Whether to also delete the corresponding ingress and subdomain ingresses',
			type: 'boolean',
			default: false,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { domainId, transit, deleteIngresses } = properties;

		return apiClient.request({
			path: `/domains/${domainId}`,
			method: 'DELETE',
			qs: {
				transit,
				deleteIngresses,
			},
		});
	});
