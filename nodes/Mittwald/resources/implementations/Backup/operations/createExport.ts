import { backupResource } from '../resource';
import Z from 'zod';

export default backupResource
	.addOperation({
		name: 'Create Export',
		action: 'Create a backup export',
		description: 'Request an export download for a backup',
	})
	.withProperties({
		backupId: {
			displayName: 'Backup ID',
			type: 'string',
			default: '',
		},
		format: {
			displayName: 'Format',
			type: 'options',
			default: 'tar',
			options: [
				{
					name: 'Tar',
					value: 'tar',
				},
				{
					name: 'Zip',
					value: 'zip',
				},
			],
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { backupId, format } = properties;

		return apiClient.request({
			path: `/project-backups/${backupId}/export`,
			method: 'POST',
			requestSchema: Z.object({
				format: Z.enum(['tar', 'zip']),
			}),
			body: {
				format,
			},
		});
	});
