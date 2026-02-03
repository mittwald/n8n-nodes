import { INodeProperties, NodeParameterValueType } from 'n8n-workflow';
import { NodePropertyTypes } from 'n8n-workflow/dist/esm/interfaces';

export interface OperationPropertyConfig {
	name: string;
	displayName: string;
	type: NodePropertyTypes;
	default: NodeParameterValueType;
	required?: boolean;
	description?: string;
	searchListMethod?: string;
}

export class OperationProperty {
	private readonly config: OperationPropertyConfig;
	private readonly operationId: string;

	public constructor(operationId: string, config: OperationPropertyConfig) {
		this.operationId = operationId;
		this.config = config;
	}

	public get name(): string {
		return this.config.name;
	}

	public getN8NProperty(): INodeProperties {
		return {
			...this.config,
			modes:
				this.config.type === 'resourceLocator'
					? [
							{
								name: 'list',
								displayName: 'From List',
								type: 'list',
								typeOptions: {
									searchListMethod: this.config.searchListMethod,
									searchable: true,
								},
							},
							{
								displayName: 'By ID',
								name: 'id',
								type: 'string',
								placeholder: 'Enter UUID or short ID',
							},
						]
					: undefined,
			displayOptions: {
				show: {
					operation: [this.operationId],
				},
			},
		};
	}
}
