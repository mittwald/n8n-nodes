import { domainResource } from '../resource';
import Z from 'zod';

export default domainResource
	.addOperation({
		name: 'Check Transferability',
		action: 'Check if a domain is transferable',
		description: 'Check whether a domain can be transferred',
	})
	.withProperties({
		domain: {
			displayName: 'Domain',
			type: 'string',
			default: '',
			required: true,
			description: 'The domain name to check (without protocol)',
		},
		authCode: {
			displayName: 'Auth Code',
			type: 'string',
			default: '',
			description: 'Optional auth code to check together with the domain',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { domain, authCode } = properties;

		return apiClient.request({
			path: `/domain-transferable`,
			method: 'POST',
			requestSchema: Z.object({
				domain: Z.string(),
				authCode: Z.string().optional(),
			}),
			body: {
				domain,
				authCode: authCode || undefined,
			},
		});
	});
