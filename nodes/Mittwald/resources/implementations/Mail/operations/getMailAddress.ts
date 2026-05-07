import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'Get Mail Address',
		action: 'Get a mail address',
		description: 'Get details of a specific mail address',
	})
	.withProperties({
		mailAddressId: {
			displayName: 'Mail Address ID',
			type: 'string',
			required: true,
			default: '',
			description: 'The unique identifier of the mail address',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { mailAddressId } = properties;

		return apiClient.request({
			path: `/mail-addresses/${mailAddressId}`,
			method: 'GET',
		});
	});
