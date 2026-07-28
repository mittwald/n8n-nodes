import projectProperty from '../../shared/projectProperty';
import { projectResource } from '../resource';
import Z from 'zod';

export default projectResource
	.addOperation({
		name: 'Update Storage Notification Threshold',
		action: 'Update project storage notification threshold',
		description: 'Update the storage notification threshold of a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		notificationThresholdInBytes: {
			displayName: 'Notification Threshold in Bytes',
			type: 'number',
			default: 0,
			required: true,
			description: 'Threshold in bytes; user is notified once usage exceeds this value',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { project, notificationThresholdInBytes } = properties;

		return apiClient.request({
			path: `/projects/${project}/storage-space-notification-threshold`,
			method: 'PUT',
			requestSchema: Z.object({
				notificationThresholdInBytes: Z.number().int(),
			}),
			body: {
				notificationThresholdInBytes,
			},
		});
	});
