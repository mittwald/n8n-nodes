import { domainResource } from '../resource';
import Z from 'zod';

// The PUT body is a discriminated union over the record-set type (a/cname/mx/srv/txt/caa).
// Modeling the full union here would couple us tightly to the API schema; instead we accept any
// JSON object and let the API validate. Refer to the mittwald API docs for the exact shape per
// record-set type.
export default domainResource
	.addOperation({
		name: 'Update DNS Record Set',
		action: 'Update a DNS record set',
		description:
			'Update a record set on a DNS zone. The body is a discriminated union over the record-set type (a, caa, cname, mx, srv, txt) — provide the JSON-encoded body matching the chosen type. Refer to the mittwald API documentation for the exact shape.',
	})
	.withProperties({
		dnsZoneId: {
			displayName: 'DNS Zone ID',
			description: 'The unique identifier of the DNS zone',
			type: 'string',
			default: '',
			required: true,
		},
		recordSet: {
			displayName: 'Record Set Type',
			description: 'Type of the record set to update',
			type: 'options',
			default: 'txt',
			required: true,
			// The API accepts exactly these six record sets; aaaa and ns are not among them.
			options: [
				{ name: 'A', value: 'a' },
				{ name: 'CAA', value: 'caa' },
				{ name: 'CNAME', value: 'cname' },
				{ name: 'MX', value: 'mx' },
				{ name: 'SRV', value: 'srv' },
				{ name: 'TXT', value: 'txt' },
			],
		},
		recordSetBody: {
			displayName: 'Record Set Body (JSON)',
			type: 'string',
			default: '{"settings":{"ttl":{"auto":true}},"entries":[]}',
			required: true,
			description:
				'JSON-encoded request body matching the chosen record-set type. A "settings" object is mandatory — sending records alone is rejected. Example for TXT: {"settings":{"ttl":{"auto":true}},"entries":["v=spf1 -all"]}. Refer to the mittwald API documentation for the other record-set types.',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { dnsZoneId, recordSet, recordSetBody } = properties;

		const parsedBody = JSON.parse(recordSetBody) as unknown;

		return apiClient.request({
			path: `/dns-zones/${dnsZoneId}/record-sets/${recordSet}`,
			method: 'PUT',
			requestSchema: Z.record(Z.unknown()),
			body: parsedBody as Record<string, unknown>,
		});
	});
