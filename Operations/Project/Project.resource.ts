import { createProjectOperation } from './CreateProject.operation';
import { INodeProperties } from 'n8n-workflow';

export const projectResource = {
	id: 'project',
	name: 'Project',
	operations: [
		createProjectOperation
	],

	getProperties(): Array<INodeProperties> {
		
		const options: Array<{ name: string; value: string; action: string }> = this.operations.map(operation => ({
			name: operation.name,
			value: operation.value,
			action: operation.action,
		}));
		
		const properties: INodeProperties[] = [
			{
				name: 'operation',
				default: null,
				displayName: 'Operation',
				type: 'options',
				options: [
					...options,
					{
						name: 'Delete',
						action: 'Delete Project',
						value: 'deleteProject',
					},
				],
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
			},
		];

		return properties.concat(this.operations.flatMap((operation) => operation.properties));
	}

}
