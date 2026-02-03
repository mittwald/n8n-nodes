import { Resource } from '../Resource/Resource';
import { INodeProperties, INodePropertyOptions, type IAllExecuteFunctions } from 'n8n-workflow';
import { OperationProperty } from '../OperationProperty/OperationProperty';
import type {
	OperationConfig,
	OperationExecutionFunction,
	OperationExecutionProperties,
	OperationProperties,
} from './types';
import { ApiClient } from '../../../api';

export class Operation {
	public readonly resource: Resource;
	public readonly config: OperationConfig;
	private readonly executionFn: OperationExecutionFunction;
	public readonly properties: OperationProperty[];

	public constructor(
		resource: Resource,
		config: OperationConfig,
		executionFn: OperationExecutionFunction,
		properties: OperationProperties,
	) {
		this.resource = resource;
		this.config = config;
		this.executionFn = executionFn;
		this.properties = Object.values(properties).map(
			(propConfig) => new OperationProperty(this, propConfig),
		);
	}

	public get name() {
		return this.config.name;
	}

	public get id() {
		return `${this.resource.name}-${this.name}`;
	}

	public getN8NOption(): INodePropertyOptions {
		return {
			name: this.name,
			value: this.name,
			action: this.config.action,
		};
	}

	public getN8NProperties(): Array<INodeProperties> {
		return this.properties.map((property) => property.getN8NProperty());
	}

	private getExecutionProperties(node: IAllExecuteFunctions, itemIndex: number) {
		return Object.fromEntries(
			this.properties.map((property) => [
				property.name,
				property.getPropertyValue(node, itemIndex),
			]),
		) as OperationExecutionProperties;
	}

	public async execute(node: IAllExecuteFunctions, itemIndex: number) {
		const apiClient = new ApiClient(node);
		const properties = this.getExecutionProperties(node, itemIndex);
		return this.executionFn({
			apiClient,
			properties,
		});
	}
}
