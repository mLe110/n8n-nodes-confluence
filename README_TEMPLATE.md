# n8n-nodes-_node-name_

This is an n8n community node. It lets you use _app/service name_ in your n8n workflows.

_App/service name_ is _one or two sentences describing the service this node integrates with_.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials) <!-- delete if no auth needed -->  
[Compatibility](#compatibility)  
[Usage](#usage) <!-- delete if not using this section -->  
[Resources](#resources)  
[Version history](#version-history) <!-- delete if not using this section -->

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

_List the operations supported by your node._

## Credentials

_If users need to authenticate with the app/service, provide details here. You should include prerequisites (such as signing up with the service), available authentication methods, and how to set them up._

## Compatibility

_State the minimum n8n version, as well as which versions you test against. You can also include any known version incompatibility issues._

## Usage

_This is an optional section. Use it to help users with any difficult or confusing aspects of the node._

_By the time users are looking for community nodes, they probably already know n8n basics. But if you expect new users, you can link to the [Try it out](https://docs.n8n.io/try-it-out/) documentation to help them get started._

### Local development (near–hot reload)

n8n does not hot-reload community nodes, but you can get a tight feedback loop by watching builds and auto-restarting n8n.

1. Build on change

- Keep TypeScript compiling your node to `dist/`:

  ```bash
  npm run dev
  # which runs: tsc --watch
  ```

2. Link your package into n8n’s custom folder

- From this repo (once):

  ```bash
  npm link
  ```

- Then link it where n8n loads community nodes:

  ```bash
  mkdir -p ~/.n8n/custom
  cd ~/.n8n/custom
  npm link n8n-nodes-confluence
  ```

3. Auto-restart n8n when your node changes

- Run n8n via nodemon and watch your installed package’s `dist/`:

  ```bash
  npx nodemon \
    --signal SIGINT \
    --watch ~/.n8n/custom/node_modules/n8n-nodes-confluence/dist \
    --watch ~/.n8n/custom/node_modules/n8n-nodes-confluence/package.json \
    --ext js,json \
    --exec "npx -y n8n start"
  ```

- Keep `npm run dev` running in another terminal. When TypeScript recompiles, nodemon restarts n8n automatically.

Notes

- Changing `package.json` entries like `n8n.nodes` requires a restart; the nodemon setup above handles this.
- If you use Docker, bind-mount your repo into `/home/node/.n8n/custom/node_modules/n8n-nodes-confluence/` and auto-restart the container on `dist/` changes (e.g., with `docker compose watch` or a host-side watcher that runs `docker restart`).

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## Version history

_This is another optional section. If your node has multiple versions, include a short description of available versions and what changed, as well as any compatibility impact._
