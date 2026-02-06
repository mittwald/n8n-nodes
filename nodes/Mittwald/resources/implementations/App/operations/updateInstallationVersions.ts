import { appResource } from '../resource';
import appInstallationProperty from '../../shared/appInstallationProperty';
import systemSoftwareProperty from '../../shared/systemSoftwareProperty';
import installationVersionProperty from '../../shared/installationVersionProperty';
import Z from 'zod';

export default appResource
	.addOperation({
		name: 'Update Software Versions',
		action: 'Update System Software Versions',
	})
	.withProperties({
		appInstallation: appInstallationProperty,
		version: installationVersionProperty,
		systemSoftware: systemSoftwareProperty,
	})
	.withExecuteFn(async (context) => {
		const { systemSoftware, appInstallation, version } = context.properties;
		const { apiClient } = context;

		const systemSoftwareTargetRequest: Record<
			string,
			{ systemSoftwareVersion: string; updatePolicy: string }
		> = {};

		// @ts-ignore
		console.log(systemSoftware);
		for (const [systemSoftwareId, semverTarget] of Object.entries(systemSoftware ?? {})) {
			// @ts-ignore
			console.log(`System Software ID: ${systemSoftwareId}, Target Version: ${semverTarget}`);
			const matchingVersions = await apiClient.request<
				Array<{
					id: string;
					externalVersion: string;
				}>
			>({
				method: 'GET',
				path: '/system-softwares/' + systemSoftwareId + '/versions',
				qs: {
					versionRange: semverTarget,
				},
			});
			// @ts-ignore
			console.log(
				`${semverTarget} Resolved Version ID: ${JSON.stringify(matchingVersions[matchingVersions.length - 1])}`,
			);
			systemSoftwareTargetRequest[systemSoftwareId] = {
				systemSoftwareVersion: matchingVersions[matchingVersions.length - 1].id,
				updatePolicy: 'inheritedFromApp',
			};
		}

		const fetchCurrentInstallationData = async () => {
			return await apiClient.request({
				method: 'GET',
				path: '/app-installations/' + appInstallation,
				responseSchema: Z.object({
					id: Z.string(),
					appVersion: Z.object({
						current: Z.string(),
						desired: Z.string().optional(),
					}),
					systemSoftware: Z.array(
						Z.object({
							systemSoftwareId: Z.string(),
							systemSoftwareVersion: Z.object({
								current: Z.string().optional(),
								desired: Z.string().optional(),
							}),
						}),
					),
				}),
			});
		};

		const currentInstallationData = await fetchCurrentInstallationData();

		const currentVersion =
			currentInstallationData.appVersion.desired ?? currentInstallationData.appVersion.current;

		// @ts-ignore
		console.log({
			appVersionId: !version || version === '' ? currentVersion! : version,
			systemSoftware: systemSoftwareTargetRequest,
		});
		await apiClient.request({
			method: 'PATCH',
			path: '/app-installations/' + appInstallation,
			requestSchema: Z.object({
				appVersionId: Z.string(),
				systemSoftware: Z.record(
					Z.string(),
					Z.object({
						systemSoftwareVersion: Z.string(),
					}),
				),
			}),
			body: {
				appVersionId: !version || version === '' ? currentVersion! : version,
				systemSoftware: systemSoftwareTargetRequest,
			},
		});

		return fetchCurrentInstallationData();
	});
