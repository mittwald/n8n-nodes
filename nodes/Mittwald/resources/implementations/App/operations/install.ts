import { appResource } from '../resource';
import softwareProperty from '../../../operationProperties/softwareProperty';
import versionProperty from '../../../operationProperties/versionProperty';
import versionConfigProperty from '../../../operationProperties/versionConfigProperty';

export default appResource
	.addOperation({
		name: 'Install',
		action: 'Install App',
	})
	.withProperties({
		project: {
			displayName: 'Project',
			name: 'project',
			type: 'string',
			default: '',
		},
		software: softwareProperty,
		version: versionProperty,
		versionConfig: versionConfigProperty,
	})
	.withExecuteFn(async (context) => {
		const { properties, apiClient } = context;
		const { project, software, version, versionConfig } = properties;

		return {};
	});
