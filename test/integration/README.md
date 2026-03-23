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
- `N8N_BASIC_AUTH_USER` (optional, only needed if your n8n instance protects API or REST routes with Basic Auth)
- `N8N_BASIC_AUTH_PASSWORD` (optional, only needed if your n8n instance protects API or REST routes with Basic Auth)
- `N8N_MITTWALD_CREDENTIAL_ID` (recommended, and required for workflow-based tests using `runWorkflow` / `createMittwaldNode`)
- `N8N_MITTWALD_CREDENTIAL_NAME` (default: `mittwald-it`, used by `runOperation` to look up or create credentials)
- `N8N_MITTWALD_NODE_TYPE` (default: `CUSTOM.mittwald`)
- `N8N_POLL_INTERVAL_MS` (default: `1500`)
- `N8N_RUN_TIMEOUT_MS` (default: `120000`)

## Optional test-specific environment variables

- `IT_INVITE_TARGET` (mail address used by invite tests)
- `IT_INVITE_USER_TOKEN` (API token of the invited user for invite acceptance tests)
- `IT_PROJECT_MEMBERSHIP_ID` (enables the membership get test)
- `IT_PROJECT_MEMBERSHIP_DELETE_ID` (enables the membership delete test)

## Running tests

```bash
pnpm run test:integration
```

The test runner loads `.env` automatically if present. If required environment variables are still
missing, integration tests are skipped. Workflows are always started through a `manualTrigger`
node via the n8n REST API.

`runOperation` can look up or create the mittwald credential automatically. Workflow-based tests
using `runWorkflow` are stricter and expect `N8N_MITTWALD_CREDENTIAL_ID`, because the credential is
embedded directly into the generated n8n workflow definition.
