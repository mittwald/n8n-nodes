import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'Get Delivery Box',
		action: 'Get a delivery box',
		description: 'Get details of a specific delivery box',
	})
	.withProperties({
		deliveryBoxId: {
			displayName: 'Delivery Box ID',
			type: 'string',
			required: true,
			default: '',
			description: 'The unique identifier of the delivery box',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { deliveryBoxId } = properties;

		return apiClient.request({
			path: `/delivery-boxes/${deliveryBoxId}`,
			method: 'GET',
		});
	});
