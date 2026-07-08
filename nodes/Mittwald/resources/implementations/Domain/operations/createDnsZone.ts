import { domainResource } from '../resource';
import Z from 'zod';

export default domainResource
	.addOperation({
		name: 'Create DNS Zone',
		action: 'Create a DNS zone',
		description:
			'Create a subordinate DNS zone under an existing parent zone. A domain’s apex zone is created automatically together with the domain.',
	})
	.withProperties({
		name: {
			displayName: 'Name',
			type: 'string',
			default: '',
			required: true,
			description:
				'The fully qualified DNS zone name (an IDN-encoded host name), for example sub.example.com',
		},
		parentZoneId: {
			displayName: 'Parent Zone ID',
			type: 'string',
			default: '',
			required: true,
			description: 'ID of the parent DNS zone this zone is created under',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { name, parentZoneId } = properties;

		return apiClient.request({
			path: '/dns-zones',
			method: 'POST',
			requestSchema: Z.object({
				name: Z.string().min(1),
				parentZoneId: Z.string().min(1),
			}),
			body: {
				name,
				parentZoneId,
			},
			responseSchema: Z.object({
				id: Z.string(),
			}),
		});
	});
