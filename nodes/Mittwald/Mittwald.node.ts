import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeParameterResourceLocator,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
	sleep,
} from 'n8n-workflow';
import { projectResource } from '../../Resources/Project';
import {
	ExecutionContext,
	PollStatusRequestConfig,
	RequestConfig,
	RequestResponse,
} from '../../Resources/types';
import { Operation } from '../../Resources/Operation';
import { searchServer } from '../../Resources/Properties/server.property';

const resources = [projectResource];

const apiBaseUrl = 'https://api.mittwald.de/v2';

const buildExecutionContext = (
	node: IExecuteFunctions,
	itemIndex: number,
	operation: Operation,
): ExecutionContext => {
	let properties = {};
	const logger = node.logger;

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

	const buildUrl = (config: RequestConfig) => `${apiBaseUrl}${config.path}`;

	const execute = async (config: RequestConfig): Promise<any> => {
		const { path, ...restConfig } = config;
		const url = buildUrl(config);

		logger.debug(`${config.method} ${url}`);
		const response: RequestResponse = await node.helpers.httpRequestWithAuthentication.call(
			node,
			'mittwaldApi',
			{
				url,
				returnFullResponse: true,
				...restConfig,
			},
		);
		logger.debug(`${config.method} ${url} ${response.statusCode}`);

		return response;
	};

	return {
		properties,
		request: {
			execute,
			executeWithPolling: async <TRes extends RequestResponse>(
				config: PollStatusRequestConfig<TRes>,
			): Promise<TRes> => {
				const { waitUntil, timeoutMs = 2000, ...restConfig } = config;
				let backoff = 100;
				const maxTime = Date.now() + timeoutMs;
				const url = buildUrl(config);

				while (true) {
					if (Date.now() > maxTime) {
						throw new Error(`polling to ${url} timed out after ${timeoutMs} ms`);
					}
					const response = (await execute({ ...restConfig, ignoreHttpStatusErrors: true })) as TRes;

					if (waitUntil(response)) {
						return response;
					}

					logger.warn(`request to ${url} returned status ${response.statusCode}, retrying...`);

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
			searchServer,
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
