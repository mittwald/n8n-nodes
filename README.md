# n8n-nodes-mittwald

This is an n8n community node. It lets you use the mittwald API in your n8n workflows.

[Mittwald](https://www.mittwald.de/) is a German hosting and cloud service provider. This node allows you to automate interactions with Mittwald resources such as projects, Redis databases, applications, and more.

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

This node provides integration with the [Mittwald API v2](https://developer.mittwald.de/). The following resources and operations are available:

### App
- **Install App**: Install an application in a project
- **Delete AppInstallation**: Remove an installed application

### Contributor
- Operations for managing contributors

### Conversation
- **Create**: Create a new conversation

### Project
- **Create**: Create a new project on a server
- **Remove**: Delete a project
- **Get**: Get project details
- **List**: List all projects

### ProjectInvite
- Operations for managing project invitations

### ProjectMembership
- **Get**: Get project membership details
- **Remove**: Delete project membership

### RedisDatabase
- **Create**: Create a new Redis database in a project
- **Remove**: Delete a Redis database by ID
- **Get**: Get details of a Redis database by ID
- **List All**: List all Redis databases in a project

### Server
- Operations for managing servers

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

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [mittwald API documentation](https://developer.mittwald.de/)
* [mittwald API v2 Reference](https://developer.mittwald.de/docs/v2/api/intro/)

## Version history

_This is another optional section. If your node has multiple versions, include a short description of available versions and what changed, as well as any compatibility impact._
