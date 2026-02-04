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
		const baseConfig: Partial<INodeProperties> = {
			displayOptions: {
				show: {
					operation: [this.operation.name],
					resource: [this.operation.resource.name],
				},
			},
		};

		if (this.config.type === 'resourceLocator') {
			const { searchListMethod, ...restConfig } = this.config;
			return {
				...baseConfig,
				...restConfig,
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

		if (this.config.type === 'resourceMapper') {
			const { resourceMapperMethod, dependsOn, displayName, ...restConfig } = this.config;
			return {
				...baseConfig,
				...restConfig,
				displayName,
				typeOptions: {
					loadOptionsDependsOn: dependsOn,
					resourceMapper: {
						valuesLabel: displayName,
						resourceMapperMethod,
						mode: 'add',
						fieldWords: {
							singular: 'column',
							plural: 'columns',
						},
						addAllFields: true,
						multiKeyMatch: true,
						supportAutoMap: false,
					},
				},
			};
		}

		return {
			...baseConfig,
			...this.config,
		};
	}

	public getPropertyValue(node: IAllExecuteFunctions, itemIndex: number): unknown {
		const value = node.getNodeParameter(this.name, itemIndex, undefined, {
			extractValue: true,
			ensureType:
				this.config.type === 'resourceLocator'
					? 'string'
					: this.config.type === 'resourceMapper'
						? 'json'
						: this.config.type,
		});

		if (this.config.type === 'resourceMapper') {
			if (typeof value !== 'object' || value === null || 'value' in value === false) {
				throw new Error('Expected value to be an object for resourceMapper type');
			}
			return value.value;
		}

		return value;
	}
}
