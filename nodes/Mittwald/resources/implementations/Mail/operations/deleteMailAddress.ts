import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'Delete Mail Address',
		action: 'Delete a mail address',
		description: 'Delete an existing mail address',
	})
	.withProperties({
		mailAddressId: {
			displayName: 'Mail Address ID',
			type: 'string',
			required: true,
			default: '',
			description: 'The unique identifier of the mail address to delete',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { mailAddressId } = properties;

		return apiClient.request({
			path: `/mail-addresses/${mailAddressId}`,
			method: 'DELETE',
		});
	});
