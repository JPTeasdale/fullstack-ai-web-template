# Secret Initialization System

A modular TypeScript-based system for initializing environment variables across multiple projects with configurable plugins for different output destinations.

## Features

- 🔍 **Auto-discovery**: Automatically finds all projects with `wrangler.jsonc` files
- 📝 **Configuration-driven**: Uses `wrangler_secrets.jsonc` files to define required secrets  
- 🔌 **Plugin architecture**: Extensible system for different output destinations
- 🎨 **Beautiful CLI**: Colored output with progress indicators
- 🔐 **Secure input**: Hidden password input for sensitive values
- ✅ **Validation**: Required/optional secret validation

## Quick Start

```bash
# Install dependencies
npm install

# Initialize .env files for all projects
npm run init:secrets

# Use a specific plugin
npm run init:secrets -- --plugin aws-secrets

# List available plugins
npm run init:secrets -- --list-plugins
```

## Configuration

### Project Configuration (`wrangler_secrets.jsonc`)

Each project can have a `wrangler_secrets.jsonc` file that defines the secrets needed:

```jsonc
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "description": "PostgreSQL connection string for the database",
      "required": true
    },
    {
      "name": "API_KEY", 
      "description": "Third-party service API key",
      "required": false
    },
    {
      "name": "JWT_SECRET",
      "description": "Secret key for signing JWT tokens",
      "required": true
    }
  ]
}
```

## Built-in Plugins

### 1. Environment File Plugin (`env-file`)

**Default plugin** - Writes secrets to local `.env` files.

```bash
npm run init:secrets
# or explicitly
npm run init:secrets -- --plugin env-file
```

**Output**: Creates/updates `.env` files in each project directory.

### 2. AWS Secrets Manager Plugin (`aws-secrets`)

Stores secrets in AWS Secrets Manager for centralized secret management.

```bash
npm run init:secrets -- --plugin aws-secrets
```

**Prerequisites**:
- AWS credentials configured (AWS CLI, environment variables, or IAM roles)
- IAM permissions for Secrets Manager operations:
  - `secretsmanager:CreateSecret`
  - `secretsmanager:UpdateSecret` 
  - `secretsmanager:DescribeSecret`

**Output**: Creates secrets in AWS Secrets Manager with naming pattern: `{project-name}/{secret-name}`

## Creating Custom Plugins

The plugin system is designed to be easily extensible. Here's how to create a custom plugin:

### 1. Implement the Plugin Interface

```typescript
import { SecretPlugin, SecretValue, ProjectConfig } from './init-secrets';

export class MyCustomPlugin implements SecretPlugin {
  name = 'my-plugin';

  async initialize(projectConfig: ProjectConfig): Promise<void> {
    // Setup logic (e.g., authenticate with service)
    console.log(`Initializing ${this.name} for ${projectConfig.projectName}`);
  }

  async writeSecret(secret: SecretValue, projectConfig: ProjectConfig): Promise<void> {
    // Write the secret to your destination
    console.log(`Writing ${secret.name} to my service`);
    // Implementation here...
  }

  async finalize(projectConfig: ProjectConfig): Promise<void> {
    // Cleanup or summary logic
    console.log(`Finished processing ${projectConfig.projectName}`);
  }
}
```

### 2. Register Your Plugin

```typescript
import { SecretInitializer } from './init-secrets';
import { MyCustomPlugin } from './plugins/my-custom-plugin';

const initializer = new SecretInitializer();
initializer.registerPlugin(new MyCustomPlugin());
```

### 3. Plugin Examples

Here are some ideas for additional plugins:

- **HashiCorp Vault Plugin**: Store secrets in Vault
- **Azure Key Vault Plugin**: Use Azure's secret management
- **Kubernetes Secrets Plugin**: Create K8s secret manifests
- **Docker Compose Plugin**: Generate docker-compose environment files
- **CI/CD Plugin**: Push secrets to GitHub Actions, GitLab CI, etc.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SecretInitializer                       │
├─────────────────────────────────────────────────────────────┤
│ • Project discovery (find wrangler.jsonc files)            │
│ • Configuration loading (parse wrangler_secrets.jsonc)     │
│ • User input handling (secure prompts)                     │
│ • Plugin orchestration                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Registry                          │
├─────────────────────────────────────────────────────────────┤
│ • Plugin registration and management                       │
│ • Plugin lifecycle coordination                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┬─────────────────┬─────────────────────────┐
│   EnvFilePlugin │ AwsSecretsPlugin│    CustomPlugin...      │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Write to .env │ • AWS Secrets   │ • Your implementation  │
│   files         │   Manager       │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## CLI Options

```bash
Options:
  -p, --plugin <name>   Plugin to use for writing secrets (default: "env-file")
  --list-plugins        List available plugins
  -h, --help           Display help for command
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build
```

## Migration from Bash Script

The TypeScript version maintains the same core functionality as the original bash script but adds:

- ✅ Better error handling and validation
- ✅ Plugin architecture for extensibility  
- ✅ Type safety with TypeScript
- ✅ Better user experience with inquirer prompts
- ✅ More robust JSONC parsing
- ✅ Structured, maintainable code

The configuration format (`wrangler_secrets.jsonc`) remains exactly the same, so no changes are needed to existing project configurations. 