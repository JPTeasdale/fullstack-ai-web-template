import { spawn } from 'child_process';
import chalk from 'chalk';
import { SecretPlugin, SecretValue, ProjectConfig } from '../init-secrets';

/**
 * Cloudflare Pages Plugin
 * 
 * This plugin uses the wrangler CLI to set secrets directly in Cloudflare Pages projects.
 * It automatically detects the environment and sets secrets accordingly.
 * 
 * Usage:
 * npm run init:secrets -- --plugin cloudflare-dev
 * npm run init:secrets -- --plugin cloudflare-prod
 * 
 * Prerequisites:
 * - wrangler CLI installed and authenticated
 * - Valid wrangler.jsonc file in each project directory
 * - Proper Cloudflare account access
 */
export class CloudflarePlugin implements SecretPlugin {
  name: string;
  private environment: 'development' | 'production';

  constructor(environment: 'development' | 'production' = 'development') {
    this.environment = environment;
    this.name = environment === 'development' ? 'cloudflare-dev' : 'cloudflare-prod';
  }

  async initialize(projectConfig: ProjectConfig): Promise<void> {
    console.log(chalk.cyan(`☁️  Initializing Cloudflare Pages secrets for ${projectConfig.projectName}`));
    console.log(chalk.blue(`🌍 Environment: ${this.environment}`));
    
    // Verify wrangler is available and authenticated
    try {
      await this.executeWrangler(['whoami'], projectConfig.projectDir);
      console.log(chalk.green('✅ Wrangler authentication verified'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not verify wrangler authentication'));
      console.log(chalk.blue('💡 Make sure you\'re logged in with: wrangler login'));
    }
  }

  async writeSecret(secret: SecretValue, projectConfig: ProjectConfig): Promise<void> {
    const args = ['pages', 'secret', 'put', secret.name];
    
    // Add environment flag for production
    if (this.environment === 'production') {
      args.push('--env', 'production');
    } else {
      args.push('--env', 'development');
    }

    try {
      await this.executeWrangler(args, projectConfig.projectDir, secret.value);
      console.log(chalk.green(`✅ Set secret ${secret.name} in Cloudflare Pages (${this.environment})`));
    } catch (error: any) {
      throw new Error(`Failed to set secret ${secret.name} in Cloudflare Pages: ${error.message}`);
    }
  }

  async finalize(projectConfig: ProjectConfig): Promise<void> {
    console.log(chalk.green(`🎉 All secrets for ${projectConfig.projectName} have been set in Cloudflare Pages!`));
    console.log(chalk.blue(`🌍 Environment: ${this.environment}`));
    console.log(chalk.blue(`📁 Project: ${projectConfig.projectName}`));
    console.log('-----------------------------');
  }

  /**
   * Execute a wrangler command in the specified directory
   */
  private async executeWrangler(
    args: string[], 
    cwd: string, 
    input?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('wrangler', args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute wrangler: ${error.message}`));
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Wrangler command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      // Send input (secret value) to stdin if provided
      if (input !== undefined) {
        process.stdin.write(input);
        process.stdin.end();
      }
    });
  }

  /**
   * Create a plugin instance for production environment
   */
  static forProduction(): CloudflarePlugin {
    return new CloudflarePlugin('production');
  }

  /**
   * Create a plugin instance for development environment
   */
  static forDevelopment(): CloudflarePlugin {
    return new CloudflarePlugin('development');
  }
}

// Export convenience instances
export const CloudflareDevPlugin = CloudflarePlugin.forDevelopment();
export const CloudflareProdPlugin = CloudflarePlugin.forProduction(); 