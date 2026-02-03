import { INodeProperties, type IAllExecuteFunctions } from 'n8n-workflow';
import type { Operation } from '../Operation/Operation';
import type { OperationPropertyConfig } from './types';

export class OperationProperty {
	private readonly config: OperationPropertyConfig;
	private readonly operation: Operation;

	public constructor(operation: Operation, config: OperationPropertyConfig) {
		this.operation = operation;
		this.config = config;
	}

	public get name(): string {
		return this.config.name;
	}

	public get id() {
		return `${this.operation.id}-${this.name}`;
	}

	public getN8NProperty(): INodeProperties {
		const { searchListMethod, ...restConfig } = this.config;

		const config: INodeProperties = {
			...restConfig,
			name: this.id,
			displayOptions: {
				show: {
					operation: [this.operation.id],
				},
			},
		};

		if (config.type == 'resourceLocator') {
			return {
				...config,
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod,
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter UUID or short ID',
					},
				],
			};
		}

		return config;
	}

	public getPropertyValue(node: IAllExecuteFunctions, itemIndex: number): unknown {
		return node.getNodeParameter(this.name, itemIndex, undefined, {
			extractValue: true,
			ensureType: this.config.type === 'resourceLocator' ? 'string' : this.config.type,
		});
	}
}
