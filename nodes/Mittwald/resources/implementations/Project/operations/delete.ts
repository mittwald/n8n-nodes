import { projectResource } from '../resource';

export default projectResource
	.addOperation({
		name: 'Remove',
		action: 'Delete Project',
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
