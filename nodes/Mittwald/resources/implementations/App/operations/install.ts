import { appResource } from '../resource';
import projectProperty from '../../shared/projectProperty';
import softwareProperty from '../../shared/softwareProperty';
import versionProperty from '../../shared/versionProperty';
import versionConfigProperty from '../../shared/versionConfigProperty';

export default appResource
	.addOperation({
		name: 'Install',
		action: 'Install App',
	})
	.withProperties({
		project: projectProperty,
		description: {
			displayName: 'Description',
			type: 'string',
			default: '',
		},
		installationPath: {
			displayName: 'Installation Path',
			type: 'string',
			default: '',
		},
		software: softwareProperty,
		version: versionProperty,
		versionConfig: versionConfigProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project, version, versionConfig, installationPath, description } = properties;

		if (!versionConfig) {
			throw new Error('missing versionConfig');
		}

		interface CreateAppInstallationResponseBody {
			id: string;
		}

		const appInstallation = await context.apiClient.request<CreateAppInstallationResponseBody>({
			method: 'POST',
			path: '/projects/' + project + '/app-installations',
			body: {
				appVersionId: version,
				installationPath,
				description,
				userInputs: Object.entries(versionConfig).map(([key, value]) => ({
					name: key,
					value,
				})),
			},
		});

		return apiClient.request({
			path: `/app-installations/${appInstallation.id}`,
			method: 'GET',
			polling: {
				timeoutMs: 5000,
				waitUntil: {
					status: 200,
				},
			},
		});
	});
