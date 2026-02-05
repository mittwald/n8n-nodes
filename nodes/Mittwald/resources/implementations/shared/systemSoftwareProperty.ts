import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'System Software Version Configuration Fields',
	type: 'resourceMapper',
	default: null,
	dependsOn: ['appInstallation.value'],
	resourceMapperMethodName: 'getVersionConfigFields',
	async resourceMapperMethod(this) {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		const appInstallation = this.getCurrentNodeParameter('appInstallation') as { value: string };

		interface UsedSystemSoftware {
			systemSoftwareId: string;
			systemSoftwareVersion: {
				desired: string;
			};
		}

		interface AppInstallation {
			systemSoftware: UsedSystemSoftware[];
		}

		const apiClient = new ApiClient(this);

		const installation = await apiClient.request<AppInstallation>({
			path: `/app-installations/${appInstallation.value}`,
			method: 'GET',
		});

		interface SystemSoftware {
			id: string;
			name: string;
		}

		const allSystemSoftware = await apiClient.request<Array<SystemSoftware>>({
			path: '/system-softwares',
			method: 'GET',
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

					const currentVersion = await apiClient.request<{ id: string; externalVersion: string }>({
						path:
							'/system-softwares/' +
							input.systemSoftwareId +
							'/versions/' +
							input.systemSoftwareVersion.desired,
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
