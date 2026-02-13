import { appResource } from '../resource';
import projectProperty from '../../shared/projectProperty';
import appProperty from '../../shared/appProperty';
import versionProperty from '../../shared/appVersionProperty';
import versionConfigProperty from '../../shared/versionConfigProperty';
import Z from 'zod';
import { Response } from '../../../../api/types';
import { PollingConfig } from '../../../../api/polling';

export default appResource
	.addOperation({
		name: 'Install',
		action: 'Install an app',
		description: 'Install an app on a project',
	})
	.withProperties({
		project: projectProperty,
		app: appProperty,
		version: versionProperty,
		description: {
			displayName: 'Name',
			type: 'string',
			default: '',
		},
		installationPath: {
			displayName: 'Installation Path',
			description:
				'The path where the app should be installed; leave empty to generate a default path',
			type: 'string',
			default: '',
		},
		versionConfig: versionConfigProperty,
		waitUntilInstalled: {
			displayName: 'Wait Until Installed',
			description: 'Whether to wait until the installation is completed before returning',
			type: 'boolean',
			default: false,
		},
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

		let polling: PollingConfig = { waitUntil: { untilSuccess: true }, timeoutMs: 2000 };
		if (properties.waitUntilInstalled) {
			polling = {
				timeoutMs: 300 * 1000, // 5 minutes
				waitUntil(response: Response) {
					// Response status 403 is a typical symptom of the eventual consistency behavior in the API.
					if (response.statusCode === 403) {
						return false;
					}

					if (response.statusCode >= 400) {
						throw new Error(`unexpected error while polling for app installation: ${response.statusCode}: ${JSON.stringify(response.body)}`);
					}

					return response.statusCode === 200 && response.body.phase === 'ready';
				},
			};
		}

		return apiClient.request({
			path: `/app-installations/${appInstallation.id}`,
			method: 'GET',
			polling,
		});
	});
