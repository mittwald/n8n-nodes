import { domainResource } from '../resource';
import Z from 'zod';

export default domainResource
	.addOperation({
		name: 'Update Nameservers',
		action: 'Update nameservers for a domain',
		description:
			'Update the nameservers of a domain. Provide nameserver host names as a comma-separated list (at least two are required).',
	})
	.withProperties({
		domainId: {
			displayName: 'Domain ID',
			description: 'The unique identifier of the domain',
			type: 'string',
			default: '',
			required: true,
		},
		nameservers: {
			displayName: 'Nameservers',
			type: 'string',
			default: '',
			required: true,
			description:
				'Comma-separated list of nameserver host names (e.g. "ns1.example.com, ns2.example.com")',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { domainId, nameservers } = properties;

		const nameserverList = nameservers
			.split(',')
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);

		return apiClient.request({
			path: `/domains/${domainId}/nameservers`,
			method: 'PATCH',
			requestSchema: Z.object({
				nameservers: Z.array(Z.string()).min(2),
			}),
			body: {
				nameservers: nameserverList,
			},
		});
	});
