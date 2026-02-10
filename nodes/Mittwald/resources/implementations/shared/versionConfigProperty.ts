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

		// Map of field names to their help text/examples
		const fieldHelpText: Record<string, string> = {
			host: '(requires protocol, e.g., https://)',
			site_title: '(e.g., tab name in your browser)',
		};

		return {
			fields: version.userInputs.map((input) => {
				const helpText = fieldHelpText[input.name];
				const formattedDisplayName = helpText ? `${input.name} ${helpText}` : input.name;

				return {
					displayName: formattedDisplayName,
					display: true,
					required: true,
					id: input.name,
					defaultMatch: false,
					type: input.type,
				};
			}),
		};
	},
} satisfies OperationPropertyConfig;
