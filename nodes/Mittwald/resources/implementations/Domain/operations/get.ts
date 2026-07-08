import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Get',
		action: 'Get a domain',
		description: 'Get details of a specific domain',
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
			method: 'GET',
		});
	});
