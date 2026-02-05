import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Version Config',
	type: 'resourceMapper',
	default: null,
	dependsOn: ['software.value', 'version.value'],
	resourceMapperMethodName: 'getVersionConfigFields',
	async resourceMapperMethod(this) {
		const apiClient = new ApiClient(this);

		const appId = this.getCurrentNodeParameter('software') as { value: string };
		const versionId = this.getCurrentNodeParameter('version') as { value: string };

		const version = await apiClient.request({
			path: `/apps/${appId.value}/versions/${versionId.value}`,
			method: 'GET',
			responseSchema: Z.object({
				userInputs: Z.array(
					Z.object({
						name: Z.string(),
						type: Z.enum(['string', 'number', 'boolean']),
					}),
				),
			}),
		});

		return {
			fields: version.userInputs.map((input) => ({
				displayName: input.name,
				display: true,
				required: true,
				id: input.name,
				defaultMatch: false,
				type: input.type,
			})),
		};
	},
} satisfies OperationPropertyConfig;
