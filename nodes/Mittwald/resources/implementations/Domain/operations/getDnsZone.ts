import { domainResource } from '../resource';

export default domainResource
	.addOperation({
		name: 'Get DNS Zone',
		action: 'Get a DNS zone',
		description: 'Get details of a specific DNS zone',
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
			method: 'GET',
		});
	});
