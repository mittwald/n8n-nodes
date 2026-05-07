import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Create Auth Code',
		action: 'Create an auth code for a domain',
		description: 'Create an auth code for a domain transfer',
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
			path: `/domains/${domainId}/actions/auth-code`,
			method: 'POST',
		});
	});
