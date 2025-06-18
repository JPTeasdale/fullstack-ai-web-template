#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { glob } from 'glob';

// Types and interfaces
interface SecretConfig {
  name: string;
  description: string;
  required: boolean;
}

interface ProjectConfig {
  projectDir: string;
  projectName: string;
  configPath: string;
  secrets: SecretConfig[];
}

interface SecretValue {
  name: string;
  value: string;
}

interface SecretPlugin {
  name: string;
  initialize(projectConfig: ProjectConfig): Promise<void>;
  writeSecret(secret: SecretValue, projectConfig: ProjectConfig): Promise<void>;
  finalize(projectConfig: ProjectConfig): Promise<void>;
}

// Plugin registry
class PluginRegistry {
  private plugins: Map<string, SecretPlugin> = new Map();

  register(plugin: SecretPlugin) {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): SecretPlugin | undefined {
    return this.plugins.get(name);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// File writer plugin
class EnvFilePlugin implements SecretPlugin {
  name = 'env-file';

  async initialize(projectConfig: ProjectConfig): Promise<void> {
    console.log(chalk.cyan(`📝 Initializing .env file for ${projectConfig.projectName}`));
  }

  async writeSecret(secret: SecretValue, projectConfig: ProjectConfig): Promise<void> {
    const envPath = join(projectConfig.projectDir, '.env');
    
    try {
      let envContent = '';
      if (existsSync(envPath)) {
        envContent = readFileSync(envPath, 'utf-8');
      }

      const lines = envContent.split('\n');
      const existingIndex = lines.findIndex(line => line.startsWith(`${secret.name}=`));

      if (existingIndex >= 0) {
        lines[existingIndex] = `${secret.name}=${secret.value}`;
        console.log(chalk.green(`✅ Updated ${secret.name} in .env`));
      } else {
        lines.push(`${secret.name}=${secret.value}`);
        console.log(chalk.green(`✅ Added ${secret.name} to .env`));
      }

      const { writeFileSync } = await import('fs');
      writeFileSync(envPath, lines.filter(line => line.trim()).join('\n') + '\n');
    } catch (error) {
      throw new Error(`Failed to write ${secret.name} to .env: ${error}`);
    }
  }

  async finalize(projectConfig: ProjectConfig): Promise<void> {
    console.log(chalk.green(`🎉 All environment variables for ${projectConfig.projectName} have been written to .env!`));
    console.log('-----------------------------');
  }
}

// Core application class
class SecretInitializer {
  private pluginRegistry = new PluginRegistry();

  constructor() {
    // Register default plugins
    this.pluginRegistry.register(new EnvFilePlugin());
  }

  registerPlugin(plugin: SecretPlugin) {
    this.pluginRegistry.register(plugin);
  }

  async findProjects(): Promise<string[]> {
    const pattern = '**/wrangler.jsonc';
    const files = await glob(pattern, { 
      ignore: ['**/node_modules/**'],
      cwd: process.cwd() 
    });
    
    return files.map(file => dirname(file)).sort();
  }

  parseJsonc(filePath: string): any {
    try {
      const content = readFileSync(filePath, 'utf-8');
      // Remove JSONC comments (simple approach)
      const jsonContent = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .replace(/\/\/.*$/gm, ''); // Remove // comments
      
      return JSON.parse(jsonContent);
    } catch (error) {
      throw new Error(`Failed to parse JSONC file ${filePath}: ${error}`);
    }
  }

  loadProjectConfig(projectDir: string): ProjectConfig | null {
    const configPath = join(projectDir, 'wrangler_secrets.jsonc');
    
    if (!existsSync(configPath)) {
      return null;
    }

    try {
      const config = this.parseJsonc(configPath);
      
      if (!config.secrets || !Array.isArray(config.secrets)) {
        console.log(chalk.yellow(`⚠️  Invalid configuration in ${relative(process.cwd(), configPath)}: missing or invalid 'secrets' array`));
        return null;
      }

      const secrets: SecretConfig[] = config.secrets.map((secret: any) => ({
        name: secret.name,
        description: secret.description || '',
        required: secret.required === true
      }));

      return {
        projectDir,
        projectName: relative(process.cwd(), projectDir) || projectDir,
        configPath,
        secrets
      };
    } catch (error) {
      console.log(chalk.red(`❌ Error loading configuration from ${configPath}: ${error}`));
      return null;
    }
  }

  async promptForSecrets(secrets: SecretConfig[]): Promise<SecretValue[]> {
    const secretValues: SecretValue[] = [];

    for (const secret of secrets) {
      console.log(chalk.blue(`🔐 Configuring environment variable: ${secret.name}`));
      console.log(chalk.blue(`📝 Hint: ${secret.description}`));

      const { value } = await inquirer.prompt([
        {
          type: 'password',
          name: 'value',
          message: `Enter value for ${secret.name}:`,
          mask: '*',
          validate: (input: string) => {
            if (!input && secret.required) {
              return `❌ Environment variable ${secret.name} is required but no value was provided`;
            }
            return true;
          }
        }
      ]);

      if (value) {
        secretValues.push({ name: secret.name, value });
      } else {
        console.log(chalk.cyan(`⏭️  Skipping optional environment variable: ${secret.name}`));
      }
    }

    return secretValues;
  }

  async initializeProject(projectConfig: ProjectConfig, pluginName: string): Promise<void> {
    const plugin = this.pluginRegistry.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    console.log(chalk.green(`\n🚀 Initializing environment variables for project: ${projectConfig.projectName}`));
    console.log(chalk.blue(`📁 Project directory: ${projectConfig.projectDir}`));
    console.log(chalk.blue(`📄 Configuration: ${relative(process.cwd(), projectConfig.configPath)}`));
    console.log('─'.repeat(50));

    await plugin.initialize(projectConfig);

    const secretValues = await this.promptForSecrets(projectConfig.secrets);

    for (const secret of secretValues) {
      await plugin.writeSecret(secret, projectConfig);
    }

    await plugin.finalize(projectConfig);
  }

  async run(pluginName: string = 'env-file'): Promise<void> {
    console.log(chalk.cyan('🔍 Discovering projects...\n'));

    const projectDirs = await this.findProjects();
    
    if (projectDirs.length === 0) {
      console.log(chalk.red('❌ No projects with wrangler.jsonc found.'));
      return;
    }

    console.log(chalk.blue(`📦 Found ${projectDirs.length} project(s):`));

    const projectConfigs: ProjectConfig[] = [];
    for (const dir of projectDirs) {
      const relativePath = relative(process.cwd(), dir) || dir;
      const secretsFile = join(dir, 'wrangler_secrets.jsonc');
      
      if (existsSync(secretsFile)) {
        console.log(chalk.green(`  - ${relativePath} ✅ wrangler_secrets.jsonc`));
        const config = this.loadProjectConfig(dir);
        if (config) {
          projectConfigs.push(config);
        }
      } else {
        console.log(chalk.yellow(`  - ${relativePath} ❌ wrangler_secrets.jsonc`));
      }
    }

    if (projectConfigs.length === 0) {
      console.log(chalk.red('\n❌ No projects with wrangler_secrets.jsonc found.'));
      console.log(chalk.blue('💡 Create a wrangler_secrets.jsonc file in your project directories to define environment variables.'));
      return;
    }

    console.log(chalk.cyan(`\n🎯 Processing ${projectConfigs.length} project(s) with environment configurations...`));
    console.log(chalk.blue(`🔌 Using plugin: ${pluginName}`));

    for (const projectConfig of projectConfigs) {
      try {
        await this.initializeProject(projectConfig, pluginName);
      } catch (error) {
        console.log(chalk.red(`❌ Failed to initialize environment variables for project ${projectConfig.projectName}: ${error}`));
        throw error;
      }
    }

    console.log(chalk.green('\n🎊 All project environment variables have been initialized successfully!'));
  }
}

// CLI setup
async function main() {
  const program = new Command();
  
  program
    .name('init-secrets')
    .description('Initialize environment variables for projects with wrangler_secrets.jsonc configuration files.')
    .option('-p, --plugin <name>', 'Plugin to use for writing secrets', 'env-file')
    .option('--list-plugins', 'List available plugins')
    .action(async (options) => {
      const initializer = new SecretInitializer();
      
      if (options.listPlugins) {
        console.log('Available plugins:');
        console.log(initializer['pluginRegistry'].list().map(name => `  - ${name}`).join('\n'));
        return;
      }

      try {
        await initializer.run(options.plugin);
      } catch (error) {
        console.log(chalk.red(`❌ Failed to initialize environment variables: ${error}`));
        process.exit(1);
      }
    });

  await program.parseAsync();
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export { SecretInitializer, SecretPlugin, SecretConfig, ProjectConfig, SecretValue }; 