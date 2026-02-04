import softwareProperty from '../../shared/softwareProperty';
import versionConfigProperty from '../../shared/versionConfigProperty';
import versionProperty from '../../shared/versionProperty';
import { appResource } from '../resource';

appResource
	.addOperation({
		name: 'Install',
		action: 'Install App',
	})
	.withProperties({
		project: {
			displayName: 'Project',
			type: 'string',
			default: '',
		},
		software: softwareProperty,
		version: versionProperty,
		versionConfig: versionConfigProperty,
	})
	.withExecuteFn(async () => {
		return {};
	});
