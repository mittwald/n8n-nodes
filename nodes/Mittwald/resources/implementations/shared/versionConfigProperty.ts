import { ApiClient } from '../../../api';
import type { OperationPropertyConfig } from '../../base';
import Z from 'zod';

export default {
	displayName: 'Version Config',
	type: 'resourceMapper',
	default: null,
	dependsOn: ['app.value', 'version.value'],
	resourceMapperMethodName: 'searchVersionConfigProperty',
	async resourceMapperMethod(this) {
		const apiClient = new ApiClient(this);

		const appId = this.getCurrentNodeParameter('app') as { value: string };
		const versionId = this.getCurrentNodeParameter('version') as { value: string };

		const version = await apiClient.request({
			path: `/apps/${appId.value}/versions/${versionId.value}`,
			method: 'GET',
			responseSchema: Z.object({
				userInputs: Z.array(
					Z.object({
						name: Z.string(),
						dataType: Z.string(),
					}),
				),
			}),
		});

		// Map of field names to their help text/examples
		const fieldHelpText: Record<string, string> = {
			host: '(requires protocol, e.g., https://)',
			site_title: '(e.g., tab name in your browser)',
		};

		const supportedTypes = ['string', 'number', 'boolean'] as const;

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
					type:
						input.dataType in supportedTypes
							? (input.dataType as (typeof supportedTypes)[number])
							: 'string', // Default to string if type is missing or unsupported
				};
			}),
		};
	},
} satisfies OperationPropertyConfig;
