import { Operation } from '../Operation';
import { IExecuteFunctions, INodeExecutionData, sleep } from 'n8n-workflow';
import { INodeParameterResourceLocator } from 'n8n-workflow/dist/esm/interfaces';


export const createProjectOperation: Operation = {
	name: 'Create',
	action: 'Create Project on Server',
	value: 'createProject',
	parentResources: ['project'],
	properties: [
		{
			displayName: 'Server',
			name: 'server',
			type: 'resourceLocator',
			modes: [
				{
					name: 'list',
					displayName: 'From List',
					type: 'list',
					typeOptions: {
						searchListMethod: 'searchServer',
						searchable: true,
					},
				},
				{
					displayName: 'By ID',
					name: 'id',
					type: 'string',
					placeholder: 'Enter server UUID or short ID',
				},
			],

			default: '',
			required: true,
			placeholder: 'Placeholder value',
			description: 'the uuid of the server',
			displayOptions: {
				show: {
					operation: ['createProject'],
				},
			},
		},
		{
			displayName: 'Name',
			name: 'description',
			type: 'string',
			default: '',
			placeholder: 'Placeholder value',
			description: 'The Name of the Project',
			displayOptions: {
				show: {
					operation: ['createProject'],
				},
			},
		},
	],

	async executeItem(this: IExecuteFunctions, item: INodeExecutionData, itemIndex: number): Promise<void> {
		const server = this.getNodeParameter('server', itemIndex, '') as INodeParameterResourceLocator;
		const description = this.getNodeParameter('description', itemIndex, '') as string;

		const createResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'mittwaldApi',
			{
				url: `https://api.mittwald.de/v2/servers/${server.value}/projects`,
				method: 'POST',
				body: {
					description,
				},
				returnFullResponse: true,
			},
		);

		// @ts-ignore
		console.log(createResponse.body.id);
		// @ts-ignore
		console.log(createResponse.headers.get('etag'));

		await sleep(2000); // wait for 2 seconds to ensure the project is ready

		item.json = await this.helpers.httpRequestWithAuthentication.call(this, 'mittwaldApi', {
			url: 'https://api.mittwald.de/v2/projects/' + createResponse.body.id,
			headers: {
				'if-event-reached': createResponse.headers.get('etag'),
			},
		});
	},
};

