import { mailResource } from '../resource';

export default mailResource
	.addOperation({
		name: 'Delete Delivery Box',
		action: 'Delete a delivery box',
		description: 'Delete an existing delivery box',
	})
	.withProperties({
		deliveryBoxId: {
			displayName: 'Delivery Box ID',
			type: 'string',
			required: true,
			default: '',
			description: 'The unique identifier of the delivery box to delete',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { deliveryBoxId } = properties;

		return apiClient.request({
			path: `/delivery-boxes/${deliveryBoxId}`,
			method: 'DELETE',
		});
	});
