import { domainResource } from '../resource';
import Z from 'zod';

// The HandleField shape is complex (postal address, name, email, telephone, ...) and varies by
// registry. To keep the n8n UI simple we accept a JSON string with the array of HandleField
// objects and forward it to the API as-is — refer to the mittwald API docs for the exact shape.
export default domainResource
	.addOperation({
		name: 'Update Contact',
		action: 'Update a domain contact',
		description:
			'Update one of the four domain contacts (owner, admin, technical, zone). The contact body is a JSON-encoded array of HandleField objects; refer to the mittwald API documentation for the exact shape.',
	})
	.withProperties({
		domainId: {
			displayName: 'Domain ID',
			type: 'string',
			default: '',
			required: true,
		},
		contact: {
			displayName: 'Contact Role',
			type: 'options',
			default: 'ownerc',
			required: true,
			options: [
				{ name: 'Owner', value: 'ownerc' },
				{ name: 'Admin', value: 'adminc' },
				{ name: 'Technical', value: 'techc' },
				{ name: 'Zone', value: 'zonec' },
			],
		},
		contactBody: {
			displayName: 'Contact Body (JSON)',
			type: 'string',
			default: '[]',
			required: true,
			description:
				'JSON-encoded array of HandleField objects describing the new contact data. Refer to the mittwald API documentation for the field shape.',
		},
		avoidEmailConfirmation: {
			displayName: 'Avoid Email Confirmation',
			type: 'boolean',
			default: false,
			description:
				'Whether to avoid the email confirmation if possible. If true, a transfer lock of 60 days might be applied to the domain.',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { domainId, contact, contactBody, avoidEmailConfirmation } = properties;

		const parsedContact = JSON.parse(contactBody) as unknown;

		return apiClient.request({
			path: `/domains/${domainId}/contacts/${contact}`,
			method: 'PATCH',
			requestSchema: Z.object({
				contact: Z.array(Z.record(Z.unknown())).min(1),
				avoidEmailConfirmation: Z.boolean().optional(),
			}),
			body: {
				contact: parsedContact as Array<Record<string, unknown>>,
				avoidEmailConfirmation: avoidEmailConfirmation || undefined,
			},
		});
	});
