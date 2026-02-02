import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
	sleep,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { INodeParameterResourceLocator } from 'n8n-workflow/dist/esm/interfaces';

export class Mittwald implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'mittwald API',
		name: 'mittwald',
		icon: 'file:mittwald.svg',
		group: ['input'],
		version: 1,
		description: 'Interact with the mittwald API',
		defaults: {
			name: 'mittwald',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'mittwaldApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			{
				name: 'resource',
				default: null,
				displayName: 'Resource',
				type: 'options',
				options: [
					{
						name: 'Project',
						value: 'project',
					},
					{
						name: 'Server',
						value: 'server',
					},
					{
						name: 'Domain',
						value: 'domain',
					},
					{
						name: 'App',
						value: 'app',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
				],
			},
			{
				name: 'operation',
				default: null,
				displayName: 'Operation',
				type: 'options',
				options: [
					{
						name: 'Create',
						action: 'Create Project on Server',
						value: 'createProject',
					},
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
			{
				name: 'operation',
				default: null,
				displayName: 'Operation',
				type: 'options',
				options: [
					{
						name: 'Install',
						action: 'Install App on Project',
						value: 'installApp',
					},
					{
						name: 'Delete',
						action: 'Delete App',
						value: 'deleteApp',
					},
				],
				displayOptions: {
					show: {
						resource: ['app'],
					},
				},
			},
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
	};

	methods = {
		listSearch: {
			async searchServer(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				// TODO: Add support for filtering and pagination
				const servers = await this.helpers.httpRequestWithAuthentication.call(this, 'mittwaldApi', {
					url: 'https://api.mittwald.de/v2/servers',
					json: true,
					method: 'GET',
				});

				return {
					results: servers.map((server: any) => ({
						name: `${server.description} (${server.shortId})`,
						value: server.id,
					})),
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const server = this.getNodeParameter(
					'server',
					itemIndex,
					'',
				) as INodeParameterResourceLocator;
				const description = this.getNodeParameter('description', itemIndex, '') as string;
				item = items[itemIndex];

				// @ts-ignore
				console.log(server);

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
						'if-event-reached': createResponse.headers.get("etag"),
					},
				});
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
