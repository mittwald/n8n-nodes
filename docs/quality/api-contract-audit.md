# API contract audit

One-off audit of all 130 operations against the generated mittwald API types in
`@mittwald/api-client` (`dist/types/generated/v2/types.d.ts`, paths from
`dist/esm/generated/v2/descriptors.js`). It compares, per operation, the request
path and method, the zod request schema, the body we build, and response schemas
that could reject a legal API response.

Clean resources: AIHosting, Conversation, Domain, Organisation.

## Fixed

- `Container/operations/serviceResponse.ts` — `services` is optional in
  `ContainerStackResponse`; requiring it would fail validation for an empty stack.
- `App/operations/requestInstallationCopy.ts` — an unset target project was sent
  as `targetProjectId: ''`. The field is optional; it is now omitted.
- `shared/installationVersionProperty.ts`, `App/operations/updateInstallationVersions.ts`
  — `appVersion.current` is optional in `AppVersionStatus` (absent during the
  first install) and `desired` is required; our schemas had it the other way round.
- `Database/operations/mysqlCreate.ts` — `accessLevel` only accepts `full` for the
  user created together with the database, and that user takes no description.

## Open: spec says one thing, the server may be lenient

These endpoints are covered by integration tests that pass values the spec does
not allow. Either the server tolerates it or the test has not run against the
affected path — worth one live run before changing the request shape.

- `Mail/operations/createMailAddress.ts` — the API accepts either
  `MailCreateForwardAddress` (`address`, `forwardAddresses`) or
  `MailCreateMailAddress` with a nested `mailbox: { password, quotaInBytes,
  enableSpamProtection }`. We send those three fields flat and never send
  `mailbox`. `autoResponder` is part of neither variant.
- `Mail/operations/updateMailAddressAutoresponder.ts` — `active`, `message`,
  `startsAt`, `expiresAt` belong into a nested `autoResponder` object.
- `App/operations/install.ts` — `updatePolicy` is required in the request body and
  is never sent. `userInputs[].value` is `string` in `AppSavedUserInput`, our
  schema accepts any JSON value.
- `Contributor/*` (4 operations) — the path takes a contributor ID, we pass the
  customer ID from the organisation locator. `MarketplaceContributor` has both
  `id` and `customerId`, so these are different identifiers.

## Open: empty path parameters (~35 operations, all resources)

Resource locators and ID fields are mostly not `required`, so an empty value
builds a path like `/projects//backups`. The API answers with an error, but the
message does not point at the missing input. This is UX hardening across nearly
every operation rather than a contract defect, so it is tracked separately.

## Keeping this from happening again

The generated types can be enforced at compile time by exporting an operation's
request schema and asserting it in a file that never ships:

```ts
schema satisfies Z.ZodType<MittwaldAPIV2.Paths.<Endpoint>.Post.Parameters.RequestBody>;
```

`@mittwald/api-client` must not be imported from `nodes/` — the
`@n8n/community-nodes/no-restricted-imports` rule rejects it even as a type-only
import — so the assertions belong under `test/`, which needs its own tsconfig
because the root config excludes it.
