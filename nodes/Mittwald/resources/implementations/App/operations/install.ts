import { appResource } from '../resource';

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
	})
	.withExecuteFn(async () => {
		return {};
	});
