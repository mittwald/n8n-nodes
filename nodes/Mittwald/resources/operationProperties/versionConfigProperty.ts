import { ILoadOptionsFunctions, ResourceMapperFields } from 'n8n-workflow';
import { ApiClient } from '../../api';
import type { OperationPropertyConfig } from '../base';

// TODO: Helper class to config and map operation properties
const versionConfigProperty: OperationPropertyConfig = {
	displayName: 'Version Config',
	name: 'versionConfig',
	type: 'resourceMapper',
	resourceMapperMethod: 'mapAppVersionConfig',
	default: null,
	dependsOn: ['software.value', 'version.value'],
} satisfies OperationPropertyConfig;

export async function mapAppVersionConfig(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	// TODO: Add support for pagination
	// reference: https://developer.mittwald.de/docs/v2/reference/project/project-list-servers/
	this.logger.info(
		'fetching versions for software (app) from mittwald API https://api.mittwald.de/v2/servers',
	);
	const appId = this.getCurrentNodeParameter('software') as { value: string };
	const versionId = this.getCurrentNodeParameter('version') as { value: string };
	const project = this.getCurrentNodeParameter('project') as string;

	// @ts-ignore
	console.log('Current App ID:', appId, project);
	interface AppVersion {
		userInputs: Array<{ name: string }>;
	}

	const apiClient = new ApiClient(this);

	const version = await apiClient.request<AppVersion>({
		path: `/apps/${appId.value}/versions/${versionId.value}`,
		method: 'GET',
	});

	// @ts-ignore
	console.log(version);

	return {
		fields: version.userInputs.map((input) => ({
			displayName: input.name,
			display: true,
			required: true,
			id: input.name,
			defaultMatch: false,
		})),
	};
}

export default versionConfigProperty;
