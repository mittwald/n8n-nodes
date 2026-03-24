# Integration Tests

These tests execute mittwald operations through a real n8n instance and verify the result against
the mittwald API.

## Required environment variables

- `N8N_BASE_URL` (example: `http://localhost:5678`)
- `N8N_API_KEY`
- `N8N_REST_LOGIN_EMAIL`
- `N8N_REST_LOGIN_PASSWORD`
- `IT_MITTWALD_API_TOKEN`
- `IT_SERVER_ID`

## Optional environment variables

- `N8N_API_BASE_PATH` (default: `/api/v1`)
- `N8N_REST_BASE_PATH` (default: `/rest`)
- `N8N_MITTWALD_CREDENTIAL_ID` (recommended, and required for workflow-based tests using `runWorkflow` / `createMittwaldNode`)
- `N8N_MITTWALD_CREDENTIAL_NAME` (default: `mittwald-it`, used by `runOperation` to look up or create credentials)
- `N8N_MITTWALD_NODE_TYPE` (default: `CUSTOM.mittwald`)
- `N8N_POLL_INTERVAL_MS` (default: `1500`)
- `N8N_RUN_TIMEOUT_MS` (default: `120000`)

## Optional test-specific environment variables

- `IT_INVITE_TARGET` (mail address used by invite tests)
- `IT_INVITE_USER_TOKEN` (API token of the invited user for invite acceptance tests)

## Running tests

First some initial setup is required. The n8n instance has to be started via docker compose.
Then a User has to be created and an API key. Finally, the required environment variables have to be set. A convenient way to do this is to rename the .env.example file to .env and fill in the values.

```bash
pnpm run test:integration
```

The test runner loads `.env` automatically if present. If required environment variables are still
missing, integration tests are skipped. Workflows are always started through a `manualTrigger`
node via the n8n REST API.

## Preferred way to write tests

New integration tests should be written as business scenarios via `context.scenario()`.

```ts
testcase('creates and fetches a project', async (context) => {
	const result = await context
		.scenario('Project lifecycle')
		})
		.step({
			name: 'Create Project',
			resource: 'Project',
			operation: 'Create',
			parameters: {
				server: {
					mode: 'id',
					value: context.env.testServerId,
				},
				description: 'it-example-project',
			},
		})
		.step({
			name: 'Get Project',
			resource: 'Project',
			operation: 'Get',
			parameters: {
				project: fromStep('Create Project'),
			},
		})
		.run();

	expect(result.step('Get Project').requireString('id')).toBe(
		result.step('Create Project').requireString('id'),
	);
});
```

Why this is the preferred style:

- tests read top to bottom like a real user flow
- the n8n workflow wiring is hidden
- step outputs are accessed by step name via `result.step('...')`

`runOperation` and `runWorkflow` still exist as escape hatches for special cases, but they should
not be the default starting point for new tests.

Workflow-based tests use the same mittwald credential for all nodes and therefore expect
`N8N_MITTWALD_CREDENTIAL_ID` to be set.
