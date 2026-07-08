import { backupResource } from '../resource';

export default backupResource
	.addOperation({
		name: 'Get',
		action: 'Get a backup',
		description: 'Get details of a specific backup',
	})
	.withProperties({
		backupId: {
			displayName: 'Backup ID',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { backupId } = properties;

		return apiClient.request({
			path: `/project-backups/${backupId}`,
			method: 'GET',
		});
	});
