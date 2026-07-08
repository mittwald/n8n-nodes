import { appResource } from '../resource';
import appInstallationProperty from '../../shared/appInstallationProperty';
import projectProperty from '../../shared/projectProperty';
import Z from 'zod';

export default appResource
	.addOperation({
		name: 'Request Installation Copy',
		action: 'Copy an app installation',
		description: 'Request a copy of an app installation into another project',
	})
	.withProperties({
		appInstallation: appInstallationProperty,
		project: projectProperty,
		description: {
			displayName: 'Name',
			description: 'A name for the copied installation',
			type: 'string',
			default: '',
			required: true,
		},
		installationPath: {
			displayName: 'Installation Path',
			description:
				'The path where the copy should be installed; leave empty to generate a default path',
			type: 'string',
			default: '',
		},
	})
	.withExecuteFn(async ({ properties, apiClient }) => {
		const { appInstallation, project, description, installationPath } = properties;

		return apiClient.request({
			path: `/app-installations/${appInstallation}/actions/copy`,
			method: 'POST',
			requestSchema: Z.object({
				description: Z.string(),
				targetProjectId: Z.string(),
				installationPath: Z.string().optional(),
			}),
			body: {
				description,
				targetProjectId: project,
				installationPath: installationPath || undefined,
			},
		});
	});
