import { appResource } from '../resource';
import appInstallationProperty from '../../shared/appInstallationProperty';
import projectProperty from '../../shared/projectProperty';
import Z from 'zod';

export default appResource
	.addOperation({
		name: 'Request Installation Copy',
		action: 'Copy an app installation',
		description:
			'Request a copy of an app installation into another project. The copy is created in the background and only shows up in the target project once it has finished.',
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
				// Optional in the API: left out, the copy stays in the source project.
				// Sending an empty string instead would be an invalid project ID.
				targetProjectId: Z.string().min(1).optional(),
				installationPath: Z.string().optional(),
			}),
			body: {
				description,
				targetProjectId: project || undefined,
				installationPath: installationPath || undefined,
			},
		});
	});
