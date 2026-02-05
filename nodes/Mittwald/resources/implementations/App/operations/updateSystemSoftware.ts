import { appResource } from '../resource';
import appInstallationProperty from '../../shared/appInstallationProperty';
import systemSoftwareProperty from '../../shared/systemSoftwareProperty';
import versionProperty from '../../shared/versionProperty';

export default appResource
	.addOperation({
		name: 'Update Software Versions',
		action: 'Update System Software Versions',
	})
	.withProperties({
		appInstallation: appInstallationProperty,
		systemSoftware: systemSoftwareProperty,
		version: versionProperty,
	})
	.withExecuteFn(async (context) => {
		const { systemSoftware } = context.properties;
		const { apiClient } = context;

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
				`${semverTarget} Resolved Version ID: ${JSON.stringify(matchingVersions.map((v) => ({ id: v.id, externalVersion: v.externalVersion })))}`,
			);
		}

		/*
		await apiClient.request({
			method: 'PATCH',
			path: '/app-installations/' + appInstallation,
			requestSchema: Z.object({}),
			responseSchema: Z.object({
				id: Z.string(),
			}),
			body: {},
		});
*/
		return {};
	});
