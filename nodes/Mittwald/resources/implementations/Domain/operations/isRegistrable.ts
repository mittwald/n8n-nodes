import { domainResource } from '../resource';
import Z from 'zod';

domainResource
	.addOperation({
		name: 'Check If Registrable',
		action: 'Check if domain is registrable',
		description: 'Check whether a domain name is available for registration',
	})
	.withProperties({
		fullName: {
			displayName: 'Full domain name',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { fullName } = properties;

		return await apiClient.request({
			path: `/domain-registrable`,
			method: 'POST',
			requestSchema: Z.object({
				domain: Z.string(),
			}),
			body: {
				domain: fullName,
			},
		});
	});
