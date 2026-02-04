import { Resource } from './resources/base';
import './resources/implementations/operations';
import { searchServer } from './resources/operationProperties/serverProperty';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { searchSoftware } from './resources/operationProperties/softwareProperty';
import { searchVersion } from './resources/operationProperties/versionProperty';
import { mapAppVersionConfig } from './resources/operationProperties/versionConfigProperty';
import { searchProject } from './resources/operationProperties/projectProperty';
import { searchAppInstallation } from './resources/operationProperties/appInstallationProperty';
import { searchConversationCategories } from './resources/operationProperties/conversationCategoryProperty';

export class Mittwald implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'mittwald API',
		name: 'mittwald',
		icon: 'file:mittwald.svg',
		group: ['input'],
		version: 1,
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
		resourceMapping: { mapAppVersionConfig },
		listSearch: {
			searchServer,
			searchSoftware,
			searchVersion,
			searchProject,
			searchAppInstallation,
			searchConversationCategories,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resourceName = this.getNodeParameter('resource', itemIndex, undefined, {
					ensureType: 'string',
				});
				const operationName = this.getNodeParameter('operation', itemIndex, undefined, {
					ensureType: 'string',
				});
				const operation = Resource.getOperation(resourceName, operationName);

				item = items[itemIndex];
				item.json = await operation.execute(this, itemIndex);
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
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

		return [items];
	}
}
