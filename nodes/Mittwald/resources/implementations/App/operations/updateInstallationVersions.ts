import { appResource } from '../resource';
import appInstallationProperty from '../../shared/appInstallationProperty';
import systemSoftwareProperty from '../../shared/systemSoftwareProperty';
import installationVersionProperty from '../../shared/installationVersionProperty';
import Z from 'zod';

export default appResource
	.addOperation({
		name: 'Update Software Versions',
		action: 'Update system software versions',
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
			{
				systemSoftwareVersion: string;
				updatePolicy: 'none' | 'inheritedFromApp' | 'patchLevel' | 'all';
			}
		> = {};

		for (const [systemSoftwareId, semverTarget] of Object.entries(systemSoftware ?? {})) {
			const matchingVersions = await apiClient.request({
				method: 'GET',
				path: `/system-softwares/${systemSoftwareId}/versions`,
				responseSchema: Z.array(
					Z.object({
						id: Z.string(),
						externalVersion: Z.string(),
					}),
				),
				qs: {
					versionRange: semverTarget,
				},
			});
			systemSoftwareTargetRequest[systemSoftwareId] = {
				systemSoftwareVersion: matchingVersions[matchingVersions.length - 1].id,
				updatePolicy: 'inheritedFromApp',
			};
		}

		const fetchCurrentInstallationData = async () => {
			return await apiClient.request({
				method: 'GET',
				path: `/app-installations/${appInstallation}`,
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

		await apiClient.request({
			method: 'PATCH',
			path: `/app-installations/${appInstallation}`,
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
