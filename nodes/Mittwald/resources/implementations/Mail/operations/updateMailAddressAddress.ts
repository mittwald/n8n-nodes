import { mailResource } from '../resource';
import Z from 'zod';

export default mailResource
	.addOperation({
		name: 'Update Mail Address',
		action: 'Update a mail address',
		description: 'Update the local part of an existing mail address',
	})
	.withProperties({
		mailAddressId: {
			displayName: 'Mail Address ID',
			type: 'string',
			required: true,
			default: '',
			description: 'The unique identifier of the mail address to rename',
		},
		address: {
			displayName: 'Address',
			type: 'string',
			required: true,
			default: '',
			description: 'The new full mail address (e.g. info@example.com)',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { mailAddressId, address } = properties;

		return apiClient.request({
			path: `/mail-addresses/${mailAddressId}/address`,
			method: 'PATCH',
			requestSchema: Z.object({
				address: Z.string().min(1),
			}),
			body: {
				address,
			},
		});
	});
