# n8n-nodes-mittwald

This is an n8n community node. It lets you use the mittwald API in your n8n workflows.

[mittwald](https://www.mittwald.de/) is a German hosting and cloud service provider. This node allows you to automate interactions with mittwald resources such as projects, Redis databases, applications, and more.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node provides integration with the [mittwald API v2](https://developer.mittwald.de/). The following resources and operations are available:

### App

- **Install an app**: Install an app on a project
- **List all installed apps**: Get a list of all installed apps
- **Uninstall an app**: Remove an app installation
- **Update software versions**: Update the app or system software versions of an installation

### Contributor

- **List incoming invoices**: Get a list of incoming invoices for an organisation
- **List outgoing invoices**: Get a list of outgoing invoices for an organisation
- **List own extensions**: Get a list of extensions owned by an organisation

### Conversation

- **Create a ticket**: Create a support ticket in a conversation category

### Project

- **Create a project on a server**: Create a new project on a server
- **Delete a project**: Delete an existing project
- **Get a project**: Get details of a specific project
- **List all projects**: Get a list of all projects
- **Accept an invite to a project**: Accept a project invitation using an invitation token
- **Create an invite to a project**: Create a project invitation
- **Get a project membership**: Get details of a specific project membership
- **Delete a project membership**: Remove a member from a project

### Database

- **List all Redis databases**: Get a list of all Redis databases in a project
- **Create Redis database**: Create a new Redis database in a project
- **Delete Redis database**: Delete an existing Redis database
- **Get a Redis database**: Get details of a specific Redis database

### Server

- **Get a server**: Get details of a specific server
- **List all servers**: Get a list of all servers

### Domain

- **Create and link subdomain**: Create a subdomain and link it to an app installation
- **Check if domain is registrable**: Check whether a domain name is available for registration
- **Set target installation for domain**: Set the target app installation for a domain

## Credentials

To use this node, you need to authenticate with the mittwald API using an API key.

### Prerequisites

- A mittwald account
- An API key generated from your mittwald account settings

### Setting up credentials

1. Log in to your mittwald account
2. Navigate to your account settings
3. Generate an API key
4. In n8n, create new credentials of type "Mittwald API"
5. Enter your API key

## Compatibility

_State the minimum n8n version, as well as which versions you test against. You can also include any known version incompatibility issues._

## Usage

_This is an optional section. Use it to help users with any difficult or confusing aspects of the node._

_By the time users are looking for community nodes, they probably already know n8n basics. But if you expect new users, you can link to the [Try it out](https://docs.n8n.io/try-it-out/) documentation to help them get started._

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [mittwald API documentation](https://developer.mittwald.de/)
- [mittwald API v2 Reference](https://developer.mittwald.de/docs/v2/api/intro/)

## Version history

_This is another optional section. If your node has multiple versions, include a short description of available versions and what changed, as well as any compatibility impact._
