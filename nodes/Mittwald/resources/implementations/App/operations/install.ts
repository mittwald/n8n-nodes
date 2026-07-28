import { appResource } from '../resource';
import projectProperty from '../../shared/projectProperty';
import appProperty from '../../shared/appProperty';
import versionProperty from '../../shared/appVersionProperty';
import versionConfigProperty from '../../shared/versionConfigProperty';
import Z from 'zod';

export default appResource
	.addOperation({
		name: 'Install',
		action: 'Install an app',
		description: 'Install an app on a project',
	})
	.withProperties({
		project: {
			...projectProperty,
			required: true,
		},
		// Only feeds the version dropdown; an app version ID can also be entered
		// directly, so the API never sees this value.
		app: appProperty,
		version: {
			...versionProperty,
			required: true,
		},
		description: {
			displayName: 'Name',
			description: 'Name of the app installation as shown in the mittwald backend',
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
		updatePolicy: {
			displayName: 'Update Policy',
			description: 'How the installation should pick up new app versions',
			type: 'options',
			default: 'patchLevel',
			options: [
				{
					name: 'Patch Level',
					value: 'patchLevel',
				},
				{
					name: 'All',
					value: 'all',
				},
				{
					name: 'None',
					value: 'none',
				},
			],
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
		const { project, version, versionConfig, installationPath, description, updatePolicy } =
			properties;

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
				updatePolicy: Z.enum(['none', 'patchLevel', 'all']),
				// The API stores user inputs as strings.
				userInputs: Z.array(Z.object({ name: Z.string(), value: Z.string() })),
			}),
			responseSchema: Z.object({
				id: Z.string(),
			}),
			body: {
				appVersionId: version,
				installationPath,
				description,
				updatePolicy,
				userInputs: Object.entries(versionConfig).map(([key, value]) => ({
					name: key,
					value: String(value),
				})),
			},
		});

		return apiClient.request({
			path: `/app-installations/${appInstallation.id}`,
			method: 'GET',
			polling: properties.waitUntilInstalled
				? {
						timeoutMs: 300 * 1000, // 5 minutes
						waitUntil(response) {
							// Response status 403 is a typical symptom of the eventual consistency behavior in the API.
							if (response.statusCode === 403) {
								return false;
							}

							if (response.statusCode >= 400) {
								throw new Error(
									`unexpected error while polling for app installation: ${response.statusCode}: ${JSON.stringify(response.body)}`,
								);
							}

							return response.statusCode === 200 && response.body.phase === 'ready';
						},
					}
				: {
						waitUntil: { untilSuccess: true },
						timeoutMs: 2000,
					},
			responseSchema: Z.object({
				phase: Z.string(),
			}),
		});
	});
