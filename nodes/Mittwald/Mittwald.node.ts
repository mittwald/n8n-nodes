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
import { projectResource } from '../../Operations/Project/Project.resource';

const resources = [
	{
		name: 'Project',
		value: 'project',
		resource: projectResource
	}
]

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
					...(resources.map(resource => ({name: resource.name, value: resource.value}))),
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
			...projectResource.getProperties(),
		],
	};

	methods = {
		listSearch: {
			async searchServer(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				// @ts-ignore
				console.log('Searching for servers with filter:', filter);
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
