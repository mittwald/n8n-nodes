import { INodeProperties, type IAllExecuteFunctions } from 'n8n-workflow';
import type { Operation } from '../Operation/Operation';
import type { OperationPropertyConfig } from './types';

export class OperationProperty {
	public readonly config: OperationPropertyConfig;
	private readonly operation: Operation;
	public readonly name: string;

	public constructor(name: string, operation: Operation, config: OperationPropertyConfig) {
		this.name = name;
		this.operation = operation;
		this.config = config;
	}

	public get type() {
		return this.config.type;
	}

	public get id() {
		return `${this.operation.id}-${this.name}`;
	}

	private getDisplayOptions(): INodeProperties['displayOptions'] {
		const ownDisplayOptions = (this.config as Partial<INodeProperties>).displayOptions;
		const displayOptions: INodeProperties['displayOptions'] = {
			show: {
				operation: [this.operation.name],
				resource: [this.operation.resource.name],
				...(ownDisplayOptions?.show ?? {}),
			},
		};

		if (ownDisplayOptions?.hide) {
			displayOptions.hide = ownDisplayOptions.hide;
		}

		return displayOptions;
	}

	public getN8NProperty(): INodeProperties {
		const baseConfig = {
			name: this.name,
			displayOptions: this.getDisplayOptions(),
		} satisfies Partial<INodeProperties>;

		if (this.config.type === 'resourceLocator') {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { searchListMethod, searchListMethodName, ...restConfig } = this.config;
			return {
				...restConfig,
				...baseConfig,
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: searchListMethodName,
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
			const {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				resourceMapperMethod,
				resourceMapperMethodName,
				dependsOn,
				displayName,
				...restConfig
			} = this.config;
			return {
				...restConfig,
				...baseConfig,
				displayName,
				typeOptions: {
					loadOptionsDependsOn: dependsOn,
					resourceMapper: {
						valuesLabel: displayName,
						resourceMapperMethod: resourceMapperMethodName,
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
			...this.config,
			...baseConfig,
		};
	}

	public getPropertyValue(node: IAllExecuteFunctions, itemIndex: number): unknown {
		const type = this.config.type;

		let value: unknown;
		try {
			value = node.getNodeParameter(this.name, itemIndex, this.config.default, {
				extractValue: true,
				ensureType:
					type === 'resourceLocator' || type === 'dateTime' || type === 'options'
						? 'string'
						: type === 'resourceMapper'
							? 'json'
							: type,
			});
		} catch (parameterError) {
			// A property gated by displayOptions is not resolvable by n8n while it is
			// hidden for the current input, and n8n throws instead of honouring the
			// fallback. Resolve it to its configured default so conditional fields
			// (e.g. Create Cronjob's shell/url destination) do not crash the node.
			if ((this.config as Partial<INodeProperties>).displayOptions) {
				return this.config.default;
			}

			throw parameterError;
		}

		if (this.config.type === 'resourceMapper') {
			if (typeof value !== 'object' || value === null || 'value' in value === false) {
				throw new Error('Expected value to be an object for resourceMapper type');
			}
			return value.value;
		}

		return value;
	}
}
