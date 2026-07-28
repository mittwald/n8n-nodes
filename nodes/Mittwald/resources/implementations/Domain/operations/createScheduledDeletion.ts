import { domainResource } from '../resource';
import Z from 'zod';

export default domainResource
	.addOperation({
		name: 'Create Scheduled Deletion',
		action: 'Schedule a domain for deletion',
		description: 'Schedule a domain for deletion at a target date',
	})
	.withProperties({
		domainId: {
			displayName: 'Domain ID',
			description: 'The unique identifier of the domain',
			type: 'string',
			default: '',
			required: true,
		},
		deletionDate: {
			displayName: 'Deletion Date',
			type: 'dateTime',
			default: '',
			required: true,
			description: 'The target date for deletion (ISO-8601)',
		},
		deleteIngresses: {
			displayName: 'Delete Ingresses',
			type: 'boolean',
			default: false,
			description: 'Whether to also delete the corresponding ingress and subdomain ingresses',
		},
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { domainId, deletionDate, deleteIngresses } = properties;

		return apiClient.request({
			path: `/domains/${domainId}/scheduled-deletion`,
			method: 'POST',
			requestSchema: Z.object({
				deletionDate: Z.string(),
				deleteIngresses: Z.boolean().optional(),
			}),
			body: {
				deletionDate: new Date(deletionDate).toISOString(),
				deleteIngresses: deleteIngresses || undefined,
			},
		});
	});
