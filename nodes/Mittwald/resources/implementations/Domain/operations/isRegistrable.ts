import { domainResource } from '../resource';
import Z from 'zod';

domainResource
	.addOperation({
		name: 'Is Registrable',
		action: 'Check if Domain is Registrable',
	})
	.withProperties({
		fullName: {
			displayName: 'Full Domain Name',
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
			responseSchema: Z.object({
				registrable: Z.boolean(),
				isPremium: Z.boolean(),
			}),
			requestSchema: Z.object({
				domain: Z.string(),
			}),
			body: {
				domain: fullName,
			},
		});
	});
