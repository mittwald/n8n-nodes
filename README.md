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
- **Create an SSH user**: Create an SSH user for a project (parameters: Project, Name, Password, optional Expires At)
- **Create an SFTP user**: Create an SFTP user for a project (parameters: Project, Name, Password, Access Level, Directories, optional Expires At)
- **Delete an SSH user**: Delete an SSH user from a project (parameter: SSH User ID)
- **Delete an SFTP user**: Delete an SFTP user from a project (parameter: SFTP User ID)
- **Delete a project**: Delete an existing project
- **Get a project**: Get details of a specific project
- **Get storage statistics**: Get storage usage statistics for a project
- **Update storage notification threshold**: Update the storage notification threshold of a project
- **List all SSH users**: Get a list of all SSH users in a project (parameter: Project)
- **List all SFTP users**: Get a list of all SFTP users in a project (parameter: Project)
- **List all invites**: Get a list of all project invitations (parameter: Project)
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
- **Get storage statistics**: Get storage usage statistics for a server
- **List all servers**: Get a list of all servers
- **Update storage notification threshold**: Update the storage notification threshold of a server

### Domain

- **Create and link subdomain**: Create a subdomain and link it to an app installation
- **Check if domain is registrable**: Check whether a domain name is available for registration
- **Set target installation for domain**: Set the target app installation for a domain
- **List domains**: Get a list of all domains
- **Get a domain**: Get details of a specific domain (parameter: Domain ID)
- **Delete a domain**: Delete a domain (parameter: Domain ID)
- **Update nameservers**: Update the nameservers of a domain (parameters: Domain ID, Nameservers)
- **Update a contact**: Update one of the four domain contacts (parameters: Domain ID, Contact role, Contact body JSON)
- **Schedule a deletion**: Schedule a domain for deletion at a target date (parameters: Domain ID, Deletion Date)
- **Check transferability**: Check whether a domain can be transferred (parameter: Domain)
- **Create an auth code**: Create an auth code for a domain transfer (parameter: Domain ID)
- **Create a DNS zone**: Create a subordinate DNS zone under an existing parent zone (parameters: Name, Parent Zone ID)
- **Get a DNS zone**: Get details of a specific DNS zone (parameter: DNS Zone ID)
- **List DNS zones**: Get a list of DNS zones in a project (parameter: Project)
- **Delete a DNS zone**: Delete a DNS zone (parameter: DNS Zone ID)
- **Update a DNS record set**: Update a record set on a DNS zone (parameters: DNS Zone ID, Record Set type, Record Set body JSON)
- **List ingresses**: Get a list of all ingresses
- **Get an ingress**: Get details of a specific ingress (parameter: Ingress ID)
- **Delete an ingress**: Delete an ingress (parameter: Ingress ID)
- **Verify ingress ownership**: Trigger ownership verification for an ingress (parameter: Ingress ID)

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

This node is tested with n8n Version 2.7.4.

## Usage

1. Add the "Mittwald API" node to your workflow
2. Set up credentials using your mittwald API key (API keys can be generated in the studio [here](https://studio.mittwald.de/app/profile/api-tokens))
3. Select the desired resource and operation
4. Configure the required parameters for the operation
5. Execute the workflow to interact with the mittwald API and automate your tasks

If you aren't familiar with n8n and creating workflows, you can find help here: [Try it out](https://docs.n8n.io/try-it-out/)

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [mittwald API documentation](https://developer.mittwald.de/)
- [mittwald API v2 Reference](https://developer.mittwald.de/docs/v2/api/intro/)
