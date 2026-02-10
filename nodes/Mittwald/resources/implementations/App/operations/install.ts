import { appResource } from '../resource';
import projectProperty from '../../shared/projectProperty';
import appProperty from '../../shared/appProperty';
import versionProperty from '../../shared/versionProperty';
import versionConfigProperty from '../../shared/versionConfigProperty';
import Z from 'zod';

export default appResource
	.addOperation({
		name: 'install',
		action: 'Install an app',
	})
	.withProperties({
		project: projectProperty,
		software: appProperty,
		version: versionProperty,
		description: {
			displayName: 'Name',
			type: 'string',
			default: '',
		},
		installationPath: {
			displayName: 'Installation Path',
			type: 'string',
			default: '',
		},
		versionConfig: versionConfigProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project, version, versionConfig, installationPath, description } = properties;

		if (!versionConfig) {
			throw new Error('missing versionConfig');
		}

		const appInstallation = await context.apiClient.request({
			method: 'POST',
			path: '/projects/' + project + '/app-installations',
			requestSchema: Z.object({
				appVersionId: Z.string(),
				installationPath: Z.string(),
				description: Z.string(),
				userInputs: Z.array(Z.object({ name: Z.string(), value: Z.any() })),
			}),
			responseSchema: Z.object({
				id: Z.string(),
			}),
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
				timeoutMs: 10000,
				waitUntil: {
					status: 200,
				},
			},
		});
	});
