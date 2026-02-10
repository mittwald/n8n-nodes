import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'System software version configuration fields',
	type: 'resourceMapper',
	default: null,
	dependsOn: ['appInstallation.value'],
	resourceMapperMethodName: 'getVersionConfigFields',
	async resourceMapperMethod(this) {
		const appInstallation = this.getCurrentNodeParameter('appInstallation') as { value: string };
		const apiClient = new ApiClient(this);

		const installation = await apiClient.request({
			path: `/app-installations/${appInstallation.value}`,
			responseSchema: Z.object({
				systemSoftware: Z.array(
					Z.object({
						systemSoftwareId: Z.string(),
						systemSoftwareVersion: Z.object({
							desired: Z.string(),
						}),
					}),
				),
			}),
			method: 'GET',
		});

		const allSystemSoftware = await apiClient.request({
			path: '/system-softwares',
			method: 'GET',
			responseSchema: Z.array(
				Z.object({
					id: Z.string(),
					name: Z.string(),
				}),
			),
		});

		return {
			fields: await Promise.all(
				installation.systemSoftware.map(async (input) => {
					const matchingSoftware = allSystemSoftware.find(
						(software) => software.id === input.systemSoftwareId,
					);
					if (!matchingSoftware) {
						throw new Error(
							`Could not find system software with ID ${input.systemSoftwareId} for app installation ${appInstallation.value}`,
						);
					}

					const currentVersion = await apiClient.request({
						path: `/system-softwares/${input.systemSoftwareId}/versions/${input.systemSoftwareVersion.desired}`,
						responseSchema: Z.object({
							id: Z.string(),
							externalVersion: Z.string(),
						}),
						method: 'GET',
					});

					return {
						id: matchingSoftware.id,
						displayName: matchingSoftware.name + ' ' + currentVersion.externalVersion,
						type: 'string',
						default: currentVersion.externalVersion,
						required: false,
						defaultMatch: false,
						display: true,
					};
				}),
			),
		};
	},
} satisfies OperationPropertyConfig;
