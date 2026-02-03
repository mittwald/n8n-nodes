import { ExecutionFunction, OperationConfig } from './types';
import { Resource } from './Resource';
import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { OperationProperty } from './OperationProperty';

export class Operation {
	private readonly resource: Resource;
	public readonly config: OperationConfig;
	public readonly executionFn: ExecutionFunction;
	public readonly properties: OperationProperty[];

	public constructor(
		resource: Resource,
		config: OperationConfig,
		executionFn: ExecutionFunction,
		properties: OperationProperty[],
	) {
		this.resource = resource;
		this.config = config;
		this.executionFn = executionFn;
		this.properties = properties;
	}
	public getN8NOption(): INodePropertyOptions {
		return {
			name: this.config.name,
			value: this.id,
			action: this.config.action,
		};
	}

	public getN8NProperties(): Array<INodeProperties> {
		return this.properties.map((property) => property.getN8NProperty());
	}

	public get id() {
		return `${this.resource.name}-${this.config.name}`;
	}
}
