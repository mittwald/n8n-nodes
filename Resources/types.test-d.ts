import { expectTypeOf } from 'vitest';
import { OperationPropertyType } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
function TestOperationPropertyType() {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// @ts-ignore
	function testType() {
		expectTypeOf<string>(
			{} as OperationPropertyType<{
				name: 'Test';
				displayName: 'Test';
				type: 'string';
			}>,
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// @ts-ignore
	function testTypeWithDefaultValue() {
		expectTypeOf<string | null>(
			{} as OperationPropertyType<{
				name: 'Test';
				displayName: 'Test';
				type: 'string';
				default: null;
			}>,
		);
	}
}
