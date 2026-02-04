import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';

export default {
	displayName: 'Version Config',
	type: 'resourceMapper',
	default: null,
	dependsOn: ['software.value', 'version.value'],
	resourceMapperMethodName: 'getVersionConfigFields',
	async resourceMapperMethod(this) {
		// TODO: Add support for pagination
		// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
		const appId = this.getCurrentNodeParameter('software') as { value: string };
		const versionId = this.getCurrentNodeParameter('version') as { value: string };
		interface AppVersion {
			userInputs: Array<{ name: string }>;
		}

		const apiClient = new ApiClient(this);

		const version = await apiClient.request<AppVersion>({
			path: `/apps/${appId.value}/versions/${versionId.value}`,
			method: 'GET',
		});

		return {
			fields: version.userInputs.map((input) => ({
				displayName: input.name,
				display: true,
				required: true,
				id: input.name,
				defaultMatch: false,
			})),
		};
	},
} satisfies OperationPropertyConfig;
