# Integration Tests

These tests execute mittwald operations through a real n8n instance and verify the result against
the mittwald API.

## Required environment variables

- `N8N_BASE_URL` (example: `http://localhost:5678`)
- `N8N_API_KEY`
- `IT_MITTWALD_API_TOKEN`
- `IT_SERVER_ID`

## Optional environment variables

- `N8N_API_BASE_PATH` (default: `/api/v1`)
- `N8N_REST_BASE_PATH` (default: `/rest`, used as fallback to run workflows)
- `N8N_WEBHOOK_BASE_PATH` (default: `/webhook`, used to trigger webhook-based runs)
- `N8N_TRIGGER_MODE` (`manual` or `webhook`, default: `manual`)
- `N8N_BASIC_AUTH_USER` (required for REST fallback)
- `N8N_BASIC_AUTH_PASSWORD` (required for REST fallback)
- `N8N_REST_LOGIN_EMAIL` (optional, used to log in to `/rest` and persist cookies)
- `N8N_REST_LOGIN_PASSWORD` (optional, used to log in to `/rest` and persist cookies)
- `N8N_MITTWALD_CREDENTIAL_ID` (if missing, the test runner will look up or create credentials)
- `N8N_MITTWALD_CREDENTIAL_NAME` (default: `mittwald-it`, used for lookup/creation)
- `N8N_MITTWALD_NODE_TYPE` (default: `n8n-nodes-mittwald.mittwald`)
- `N8N_POLL_INTERVAL_MS` (default: `1500`)
- `N8N_RUN_TIMEOUT_MS` (default: `120000`)
- `IT_TEST_TIMEOUT_MS` (default: `120000`)

## Running tests

```bash
pnpm run test:integration
```

The test runner loads `.env` automatically if present. If required environment variables are still
missing, integration tests are skipped.
