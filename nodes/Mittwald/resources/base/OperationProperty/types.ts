import type { NodeParameterValueType } from 'n8n-workflow';

type SupportedNodePropertyType = 'string' | 'number' | 'boolean' | 'resourceLocator';

export interface OperationPropertyConfig {
	name: string;
	displayName: string;
	type: SupportedNodePropertyType;
	default: NodeParameterValueType;
	required?: boolean;
	description?: string;
	searchListMethod?: string;
}
