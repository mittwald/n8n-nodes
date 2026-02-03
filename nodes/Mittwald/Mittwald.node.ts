import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
	INodeParameterResourceLocator,
	sleep,
} from 'n8n-workflow';
import { projectResource } from '../../Resources/Project';
import {
	ExecutionContext,
	OperationProperties,
	PollStatusRequestConfig,
	RequestConfig,
	RequestResponse,
} from '../../Resources/types';
import { Operation } from '../../Resources/Operation';

const resources = [projectResource];

const buildExecutionContext = (
	node: IExecuteFunctions,
	itemIndex: number,
	operation: Operation,
): ExecutionContext<OperationProperties> => {
	let properties = {};

	for (const property of operation.properties) {
		if (property.getN8NProperty().type === 'resourceLocator') {
			const paramValue = node.getNodeParameter(
				property.name,
				itemIndex,
			) as INodeParameterResourceLocator;

			properties = {
				...properties,
				[property.name]: paramValue.value,
			};
		} else {
			const paramValue = node.getNodeParameter(property.name, itemIndex);
			properties = {
				...properties,
				[property.name]: paramValue,
			};
		}
	}

	return {
		properties,
		request: {
			execute: (config: RequestConfig) => {
				return node.helpers.httpRequestWithAuthentication.call(node, 'mittwaldApi', {
					url: `https://api.mittwald.de/v2${config.path}`,
					method: config.method,
					body: config.body,
					returnFullResponse: true,
				});
			},
			executeWithPolling: async <TRes extends RequestResponse>(
				config: PollStatusRequestConfig<TRes>,
			) => {
				let backoff = 100;
				const currentTime = Date.now();
				const maxTime = currentTime + (config.timeoutMs ?? 500);
				while (true) {
					if (Date.now() > maxTime) {
						throw new Error('Polling timed out');
					}
					const response = await node.helpers.httpRequestWithAuthentication.call(
						node,
						'mittwaldApi',
						{
							url: `https://api.mittwald.de/v2${config.path}`,
							method: config.method,
							body: config.body,
							returnFullResponse: true,
							ignoreHttpStatusErrors: true,
						},
					);
					if (config.waitUntil(response)) {
						return response;
					}

					await sleep(backoff);
					backoff = Math.min(backoff * 2, 2000); // Exponential backoff up to 2 seconds
				}
			},
		},
	};
};

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
				options: [...resources.map((resource) => ({ name: resource.name, value: resource.value }))],
			},
			...projectResource.getN8NProperties(),
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
				const resourceId = this.getNodeParameter('resource', itemIndex) as string;
				const operationValue = this.getNodeParameter('operation', itemIndex) as string;

				const resource = resources.find((res) => res.value === resourceId);
				const operation = resource?.findOperationByValue(operationValue);

				if (!operation) {
					throw new Error('Operation not found for the specified resource.');
				}

				const executionContext = buildExecutionContext(this, itemIndex, operation);
				item = items[itemIndex];
				item.json = await operation.executionFn(executionContext);
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
