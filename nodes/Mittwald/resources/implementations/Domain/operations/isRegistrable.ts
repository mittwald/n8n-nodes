import { domainResource } from '../resource';
import Z from 'zod';

domainResource
	.addOperation({
		name: 'IsRegistrable',
		action: 'Check if domain is registrable',
	})
	.withProperties({
		fullName: {
			displayName: 'full domain name',
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
