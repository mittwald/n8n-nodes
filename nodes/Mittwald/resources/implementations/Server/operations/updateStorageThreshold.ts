import serverProperty from '../../shared/serverProperty';
import { serverResource } from '../resource';
import Z from 'zod';

export default serverResource
	.addOperation({
		name: 'Update Storage Notification Threshold',
		action: 'Update server storage notification threshold',
		description: 'Update the storage notification threshold of a server',
	})
	.withProperties({
		server: serverProperty,
		notificationThresholdInBytes: {
			displayName: 'Notification Threshold in Bytes',
			type: 'number',
			default: 0,
			required: true,
			description: 'Threshold in bytes; user is notified once usage exceeds this value',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { server, notificationThresholdInBytes } = properties;

		return apiClient.request({
			path: `/servers/${server}/storage-space-notification-threshold`,
			method: 'PUT',
			requestSchema: Z.object({
				notificationThresholdInBytes: Z.number().int(),
			}),
			body: {
				notificationThresholdInBytes,
			},
		});
	});
