import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Delete DNS Zone',
		action: 'Delete a DNS zone',
		description: 'Delete a DNS zone',
	})
	.withProperties({
		dnsZoneId: {
			displayName: 'DNS Zone ID',
			description: 'The unique identifier of the DNS zone',
			type: 'string',
			default: '',
			required: true,
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { dnsZoneId } = properties;

		return apiClient.request({
			path: `/dns-zones/${dnsZoneId}`,
			method: 'DELETE',
		});
	});
