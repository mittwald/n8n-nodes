import { Resource } from './resources/base';
import './resources/implementations/operations';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

export class Mittwald implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'mittwald API',
		name: 'mittwald',
		icon: 'file:mittwald.svg',
		group: ['input'],
		defaultVersion: 1,
		version: [1],
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
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
		properties: Resource.getN8NProperties(),
	};

	methods = {
		listSearch: { ...Resource.getN8NListSearchFunctions() },
		resourceMapping: { ...Resource.getN8NResourceMappingFunctions() },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resourceName = this.getNodeParameter('resource', itemIndex, undefined, {
					ensureType: 'string',
				});
				const operationName = this.getNodeParameter('operation', itemIndex, undefined, {
					ensureType: 'string',
				});
				const operation = Resource.getOperation(resourceName, operationName);

				const result = await operation.execute(this, itemIndex);

				// If the result is an array, create a separate item for each element
				if (Array.isArray(result)) {
					returnData.push(
						...result.map((item) => ({
							json: item,
							pairedItem: itemIndex,
						})),
					);
				} else {
					returnData.push({
						json: result,
						pairedItem: itemIndex,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
