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

### AI Hosting

- **Create a project key**: Create a new AI hosting API key scoped to a project (parameters: Project, Name, optional Create Web UI Container)
- **Delete a project key**: Delete an AI hosting key from a project (parameters: Project, Key ID)
- **Get project usage**: Get the AI hosting plan and usage details of a project (parameter: Project)
- **Create a customer key**: Create a new AI hosting API key scoped to a customer (parameters: Customer ID, Name, optional Project ID, optional Create Web UI Container)
- **Delete a customer key**: Delete an AI hosting key from a customer (parameters: Customer ID, Key ID)
- **Get customer usage**: Get the AI hosting plan and usage details of a customer (parameter: Customer ID)

### App

- **Install an app**: Install an app on a project (parameters: Project, App, App Version, Name, optional Installation Path, Update Policy, Version Config)
- **List all installed apps**: Get a list of all installed apps
- **Uninstall an app**: Remove an app installation
- **Update software versions**: Update the app or system software versions of an installation. The version selector only offers the versions the installation can actually be updated to. The upgrade runs in the background: the response reports the target under `appVersion.desired`, while `appVersion.current` only follows once it has completed. Leave the system software fields empty to update the app only.
- **List all available apps**: Get a list of all available apps
- **Get an app**: Get details of a specific app (parameter: App)
- **List app versions**: Get a list of available versions for an app (parameter: App)
- **Get an app version**: Get details of a specific app version (parameters: App, App Version)
- **Get an app installation**: Get details of a specific app installation (parameter: App Installation)
- **List app installations of a project**: Get a list of app installations belonging to a project (parameter: Project)
- **Copy an app installation**: Request a copy of an app installation into another project (parameters: App Installation, target Project, Name, optional Installation Path). The copy is created in the background and only shows up in the target project once it has finished.
- **List system softwares**: Get a list of available system software packages
- **Get a system software**: Get details of a specific system software (parameter: searchable System Software selector)
- **List system software versions**: Get a list of versions for a system software (parameter: searchable System Software selector)
- **Get a system software version**: Get details of a specific system software version (parameters: searchable System Software selector, System Software Version ID)

### Backup

- **Create**: Create a manual backup of a project (parameters: Project, Name, Expiration Time)
- **List**: Get a list of backups belonging to a project (parameter: Project)
- **Get**: Get details of a specific backup (parameter: Backup ID)
- **Create export**: Request an export download for a backup (parameters: Backup ID, Format)

### Contributor

- **List incoming invoices**: Get a list of incoming invoices for an organisation
- **List outgoing invoices**: Get a list of outgoing invoices for an organisation
- **List own extensions**: Get a list of extensions owned by an organisation
- **List contract partners**: Get a list of contract partners associated with a contributor

### Organisation

- **List organisations**: Get all organisations the authenticated user has access to (parameters: optional Role, optional Search)
- **Create an invite**: Invite a user to an organisation (parameters: Organisation, Email Address, Role, optional Message)
- **Delete a membership**: Remove a member from an organisation (parameter: Membership ID)

### Contract

- **Terminate a contract**: Schedule the termination of a contract (parameters: Contract ID, optional Target Date, optional Reason)
- **Terminate a contract item**: Schedule the termination of a contract item (parameters: Contract ID, Contract Item ID, optional Target Date, optional Reason). Positions backed by their own resource — a domain, for example — cannot be terminated here and answer with HTTP 412; delete that resource instead.
- **Get an invoice**: Get details of an invoice (parameter: Invoice ID)
- **List invoices**: Get a list of invoices for a customer (parameter: Customer ID)

### Container

- **Create service**: Create a service in a project (parameters: Project, Service Name, Image, Name); returns the created service, so its `id` can be passed to the service operations below
- **Update service**: Update a service in a project (parameters: Project, Service Name); returns the updated service
- **Delete service**: Delete a service from a project (parameters: Project, Service Name)
- **Service action**: Run an action on a service (parameters: Project, Service ID, Action)
- **Get service logs**: Get logs of a service (parameters: Project, Service ID, optional Tail)
- **List services**: Get a list of services in a project (parameter: Project)
- **List volumes**: Get a list of volumes in a project (parameter: Project)
- **List registries**: Get a list of container registries in a project (parameter: Project)
- **Create registry**: Create a container registry (parameters: Project, Hostname / URI, Name)
- **Update registry**: Update a container registry (parameters: Project, Registry)
- **Delete registry**: Delete a container registry (parameters: Project, Registry)

### Conversation

- **Create a ticket**: Create a support ticket in a conversation category
- **List**: Get all conversations the authenticated user has created or has access to
- **Get**: Get details of a specific conversation
- **List messages**: Get all messages of a conversation (parameter: Conversation)
- **Create a message**: Send a new message in a conversation (parameters: Conversation, Message)

### Cronjob

- **Create a cronjob**: Create a new cronjob in a project (parameters: Project, App Installation, Name, Interval, Active, Timeout, Email, Destination)
- **List all cronjobs**: Get a list of all cronjobs in a project
- **Get a cronjob**: Get details of a specific cronjob
- **Delete a cronjob**: Delete an existing cronjob
- **Trigger a cronjob**: Manually trigger an execution of a cronjob
- **List cronjob executions**: Get a list of executions for a cronjob
- **Get a cronjob execution**: Get details of a specific cronjob execution

### SSH/SFTP User

SSH and SFTP users share one resource, matching how they are grouped in mStudio. These
operations used to sit under _Project_; workflows built before that move have to pick the
resource again, the operation and its parameters stay the same.

- **Create an SSH user**: Create an SSH user for a project (parameters: Project, Name, Password, optional Expires At)
- **Create an SFTP user**: Create an SFTP user for a project (parameters: Project, Name, Password, Access Level, Access to All Directories, Directories, optional Expires At). Turning on _Access to All Directories_ grants the user the whole project, exactly as the equivalent option in mStudio does; leave it off to name directories individually.
- **Get an SSH user**: Get details of a specific SSH user (parameter: SSH User ID)
- **Get an SFTP user**: Get details of a specific SFTP user (parameter: SFTP User ID)
- **List all SSH users**: Get a list of all SSH users in a project (parameter: Project)
- **List all SFTP users**: Get a list of all SFTP users in a project (parameter: Project)
- **Delete an SSH user**: Delete an SSH user from a project (parameter: SSH User ID)
- **Delete an SFTP user**: Delete an SFTP user from a project (parameter: SFTP User ID)

### Project

- **Create a project on a server**: Create a new project on a server
- **Delete a project**: Delete an existing project
- **Get a project**: Get details of a specific project
- **Get project storage statistics**: Get storage usage statistics for a project
- **Update project storage notification threshold**: Update the storage notification threshold of a project
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
- **List all MySQL databases**: Get a list of all MySQL databases in a project (parameter: Project)
- **Create MySQL database**: Create a new MySQL database with an initial user in a project (parameters: Project, Name, Version, Character Set, Collation, User Password, optional User External Access; the initial user always gets full access, as required by the API)
- **Create MySQL user**: Create an additional user for an existing MySQL database (parameters: MySQL Database ID, Name, Password, Access Level, optional External Access, optional Access IP Mask; use this for read-only access)
- **Get a MySQL database**: Get details of a specific MySQL database (parameter: MySQL Database ID)
- **Delete MySQL database**: Delete an existing MySQL database (parameter: MySQL Database ID)
- **Copy MySQL database**: Copy a MySQL database with its own initial user (parameters: MySQL Database ID, Name, User Password, optional User External Access; the copied user is created with full access)
- **List MySQL versions**: Get a list of available MySQL versions
- **List Redis versions**: Get a list of available Redis versions

### Server

- **Get a server**: Get details of a specific server
- **Get server storage statistics**: Get storage usage statistics for a server
- **List all servers**: Get a list of all servers
- **Update server storage notification threshold**: Update the storage notification threshold of a server

### Domain

- **Create and link subdomain**: Create a subdomain and link it to an app installation
- **Check if domain is registrable**: Check whether a domain name is available for registration
- **Set target installation for domain**: Set the target app installation for a domain
- **List domains**: Get a list of all domains
- **Get a domain**: Get details of a specific domain (parameter: Domain ID)
- **Delete a domain**: Delete a domain (parameters: Domain ID, optional Transit, optional Delete Ingresses). This cannot be undone — to withdraw a deletion before it happens, schedule it instead.
- **Update nameservers**: Update the nameservers of a domain (parameters: Domain ID, Nameservers). The registry runs a pre-delegation check: nameservers that do not already answer for this domain are rejected with HTTP 400 and reason `PREDELEGATION`.
- **Update a contact**: Update the owner contact of a domain (parameters: Domain ID, Contact role, Contact body JSON). The API only supports the owner role; admin, technical and zone contacts cannot be changed through this endpoint.
- **Schedule a deletion**: Schedule a domain for deletion at a target date (parameters: Domain ID, Deletion Date)
- **Check transferability**: Check whether a domain can be transferred (parameter: Domain)
- **Create an auth code**: Create an auth code for a domain transfer (parameter: Domain ID)
- **Create a DNS zone**: Create a subordinate DNS zone under an existing parent zone (parameters: Name, Parent Zone ID)
- **Get a DNS zone**: Get details of a specific DNS zone (parameter: DNS Zone ID)
- **List DNS zones**: Get a list of DNS zones in a project (parameter: Project)
- **Delete a DNS zone**: Delete a DNS zone (parameter: DNS Zone ID)
- **Update a DNS record set**: Update a record set on a DNS zone (parameters: DNS Zone ID, Record Set type, Record Set body JSON). Supported types are `a`, `caa`, `cname`, `mx`, `srv` and `txt`. The body needs a `settings` object; records alone are rejected. Example for TXT: `{"settings":{"ttl":{"auto":true}},"entries":["v=spf1 -all"]}`
- **List ingresses**: Get a list of all ingresses
- **Get an ingress**: Get details of a specific ingress (parameter: Ingress ID)
- **Delete an ingress**: Delete an ingress (parameter: Ingress ID)
- **Verify ingress ownership**: Check whether the DNS TXT record proving ownership of an ingress is in place (parameter: Ingress ID). While the proof is missing it returns `verified: false` plus the `expectedTxtRecord` that still has to be published, so a workflow can branch on it instead of failing. An ingress whose domain is managed in this account is verified from the start.

### Mail

- **Create a mail address**: Create a new mail address in a project (parameters: Project, Address, Password, Quota in Bytes, optional Forward Addresses, optional Catch-All, optional Spam Protection). With a password the address gets a mailbox; without one it only forwards, and then at least one forward address is required. Use *Update mail address autoresponder* for the auto-reply.
- **List mail addresses by project**: Get a list of mail addresses in a project (parameter: Project)
- **List mail addresses**: Get a list of all mail addresses the user has access to
- **Get a mail address**: Get details of a specific mail address (parameter: Mail Address ID)
- **Delete a mail address**: Delete a mail address (parameter: Mail Address ID)
- **Update a mail address**: Update the local part of a mail address (parameters: Mail Address ID, Address)
- **Update mail address autoresponder**: Update the auto responder of a mail address (parameters: Mail Address ID, Active, Message, optional Starts At, optional Expires At)
- **Create a delivery box**: Create a delivery box in a project (parameters: Project, Name, Password)
- **List delivery boxes**: Get a list of delivery boxes in a project (parameter: Project)
- **Get a delivery box**: Get details of a specific delivery box (parameter: Delivery Box ID)
- **Delete a delivery box**: Delete a delivery box (parameter: Delivery Box ID)

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
