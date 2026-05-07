import { domainResource } from '../resource';
import Z from 'zod';

export default domainResource
	.addOperation({
		name: 'Create DNS Zone',
		action: 'Create a DNS zone',
		description:
			'Create a new DNS zone. Provide either Domain ID or Parent Zone ID — the API validates that exactly one is set.',
	})
	.withProperties({
		name: {
			displayName: 'Name',
			type: 'string',
			default: '',
			required: true,
			description: 'The DNS zone name (an IDN-encoded host name)',
		},
		domainId: {
			displayName: 'Domain ID',
			type: 'string',
			default: '',
			description: 'Optional: ID of the domain this zone belongs to',
		},
		parentZoneId: {
			displayName: 'Parent Zone ID',
			type: 'string',
			default: '',
			description: 'Optional: ID of the parent DNS zone',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { name, domainId, parentZoneId } = properties;

		return apiClient.request({
			path: `/dns-zones`,
			method: 'POST',
			requestSchema: Z.object({
				name: Z.string(),
				domainId: Z.string().optional(),
				parentZoneId: Z.string().optional(),
			}),
			body: {
				name,
				domainId: domainId || undefined,
				parentZoneId: parentZoneId || undefined,
			},
		});
	});
