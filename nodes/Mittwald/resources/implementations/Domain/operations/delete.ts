import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Delete',
		action: 'Delete a domain',
		description: 'Delete a domain',
	})
	.withProperties({
		domainId: {
			displayName: 'Domain ID',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { domainId } = properties;

		return apiClient.request({
			path: `/domains/${domainId}`,
			method: 'DELETE',
		});
	});
