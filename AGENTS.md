# CLAUDE.md / AGENTS.md

This file provides guidance to coding agents like Claude Code or GitHub Copilot when working with code in this repository.

## Project Overview

This is **n8n-nodes-mittwald**, an n8n community node package that provides integration with the [Mittwald API v2](https://developer.mittwald.de/). It exposes a single n8n node (`mittwald`) with multiple resources and operations for managing projects, servers, apps, conversations, and more.

## Commands

- `pnpm run build` — Build the node using `n8n-node build`
- `pnpm run build:watch` — Watch mode with `tsc --watch`
- `pnpm run dev` — Development mode via `n8n-node dev`
- `pnpm run lint` — Lint with `n8n-node lint` (uses n8n's ESLint config)
- `pnpm run lint:fix` — Lint with auto-fix
- `pnpm run test:compile` — TypeScript compilation check (`tsc --noEmit`)

There is no test runner configured yet (vitest is installed but no test files exist).

## Code Style

- **Tabs** for indentation (not spaces)
- **Single quotes**, semicolons, trailing commas
- **100-char** print width
- **LF** line endings
- Strict TypeScript: `strict`, `noImplicitAny`, `noUnusedLocals`, `strictNullChecks` all enabled
- ESLint config is inherited from `@n8n/node-cli/eslint`

### Commit messages

Use Semantic Commit Messages to keep our commit history readable and to enable automated tooling (like changelogs or releases).

## Architecture

### Entry Points

- `nodes/Mittwald/Mittwald.node.ts` — Main node class implementing `INodeType`. Delegates to the Resource/Operation system for configuration and execution.
- `credentials/MittwaldApi.credentials.ts` — Bearer token credential using Mittwald API key.

### Resource/Operation/Property Pattern

The codebase uses a **declarative builder pattern** to define n8n node resources and operations. Understanding this pattern is essential:

**Resource** (`resources/base/Resource/`) — Represents an API domain (e.g., Project, Server). Has a static registry (`Resource.resources`) that auto-collects all instantiated resources. Generates n8n's `INodeProperties` and wires up list search / resource mapping methods.

**Operation** (`resources/base/Operation/`) — Represents a CRUD action on a resource. Created via the fluent builder: `resource.addOperation(config).withProperties({...}).withExecuteFn(fn)`.

**OperationProperty** (`resources/base/OperationProperty/`) — Handles three property types:

- `resourceLocator` — Searchable dropdown backed by an API list method
- `resourceMapper` — Dynamic field mapping (used for version config, etc.)
- Primitives (`string`, `number`, `boolean`) — Standard n8n property types

### Adding a New Resource

1. Create `resources/implementations/<Name>/resource.ts` — Instantiate `new Resource({ name: '<Name>' })`
2. Create `resources/implementations/<Name>/operations/` — One file per operation using the fluent builder
3. Create `resources/implementations/<Name>/operations/index.ts` — Import all operation files
4. Register in `resources/implementations/operations.ts` — Add `import './<Name>/operations'`

### Adding a New Operation to an Existing Resource

Create a new file in the resource's `operations/` directory following this pattern:

```typescript
import { myResource } from '../resource';
import Z from 'zod';

export default myResource
	.addOperation({ name: 'Get', action: 'Get a Thing' })
	.withProperties({
		thingId: { displayName: 'Thing ID', type: 'string', default: '' },
		foo: { displayName: 'Example property', type: 'string' },
	})
	.withExecuteFn(async ({ apiClient, properties }) => {
		return apiClient.request({
			path: `/things/${properties.thingId}`,
			method: 'PUT',
			body: {
				foo: properties.foo,
			},
			requestSchema: Z.object({
				foo: Z.string(),
			}),
			responseSchema: Z.object({
				/* response schema here; will also be used for return type inference */
			}),
		});
	});
```

Then import it from the resource's `operations/index.ts`.

### Shared Properties

Reusable property configs live in `resources/implementations/shared/`. These export `OperationPropertyConfig` objects (e.g., `projectProperty`, `serverProperty`) that can be spread into any operation's `withProperties()` call. Shared properties typically use the `resourceLocator` type with API-backed search lists.

### API Client

`nodes/Mittwald/api/ApiClient.ts` wraps `httpRequestWithAuthentication` to call the Mittwald API (`https://api.mittwald.de/v2`). Features:

- Zod schema validation for request/response bodies
- Polling support for async operations (exponential backoff)
- Full response mode (`returnFullResponse: true`)

### How Registration Works

When `Mittwald.node.ts` imports `'./resources/implementations/operations'`, all operation files execute their side effects (calling `resource.addOperation()`), which registers them into the static `Resource.resources` set. The main node class then calls `Resource.getN8NProperties()` to generate the full n8n configuration.

## Documentation guidelines

- All available resources and operations should be documented in `README.md`.
- Each operation should have a brief description of its purpose and parameters.
- The brand name "mittwald" should ALWAYS be lowercase when referring to the company, even at the start of a sentence.
- The operation `action` strings should follow the following requirements:
  - Correct english grammar and spelling; start with a capital letter and a verb.
  - Use "real" language, no API terminology or internal identifiers. For example, use `app installation` instead of `AppInstallation` or `app_installation`.
  - Try to use domain-specific terminology where possible. For example, use `Uninstall app` instead of `Delete app installation`.

## Coding instructions

- Follow the established Resource/Operation/Property pattern for any new functionality.
- Ensure all API interactions use the `ApiClient` with proper Zod validation.
- Exception: you MAY skip Zod validation **only** for the **response body schema** of the **final HTTP request in the successful execution path** of an operation's `execute()` function, when nothing more is done with the response than returning it as a result from the execute function.
- For API operations, use the Context7 MCP server to lookup API operations and data structures. You may also refer to any guides you find on https://developer.mittwald.de/docs/v2/category/how-tos/.
