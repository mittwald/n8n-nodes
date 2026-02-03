import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

export interface Operation {
	name: string;
	action: string;
	value: string;
	parentResources: Array<string>;
	properties: Array<INodeProperties>;
	executeItem(this: IExecuteFunctions, item: INodeExecutionData, itemIndex: number): Promise<any>;
}

