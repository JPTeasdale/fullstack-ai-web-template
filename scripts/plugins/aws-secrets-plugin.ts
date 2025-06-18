import { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';
import chalk from 'chalk';
import { SecretPlugin, SecretValue, ProjectConfig } from '../init-secrets';

/**
 * AWS Secrets Manager Plugin
 * 
 * This plugin demonstrates how to extend the secret initialization system
 * to push secrets to AWS Secrets Manager instead of local files.
 * 
 * Usage:
 * npm run init:secrets -- --plugin aws-secrets
 * 
 * Prerequisites:
 * - AWS credentials configured (AWS CLI, environment variables, or IAM roles)
 * - Proper IAM permissions for Secrets Manager operations
 */
export class AwsSecretsPlugin implements SecretPlugin {
  name = 'aws-secrets';
  private client: SecretsManagerClient;
  private region: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.client = new SecretsManagerClient({ region: this.region });
  }

  async initialize(projectConfig: ProjectConfig): Promise<void> {
    console.log(chalk.cyan(`🔐 Initializing AWS Secrets Manager for ${projectConfig.projectName}`));
    console.log(chalk.blue(`📍 Region: ${this.region}`));
    
    // Test AWS connection
    try {
      await this.client.send(new DescribeSecretCommand({ SecretId: 'test-connection-secret' }));
      console.log(chalk.green('✅ AWS connection verified'));
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(chalk.green('✅ AWS connection verified'));
      } else {
        console.log(chalk.yellow('⚠️  Could not verify AWS connection, but continuing...'));
      }
    }
  }

  async writeSecret(secret: SecretValue, projectConfig: ProjectConfig): Promise<void> {
    const secretName = `${projectConfig.projectName}/${secret.name}`;
    
    try {
      // Try to update existing secret first
      await this.client.send(new DescribeSecretCommand({ SecretId: secretName }));
      
      // Secret exists, update it
      await this.client.send(new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: secret.value,
        Description: `Environment variable for ${projectConfig.projectName}`
      }));
      
      console.log(chalk.green(`✅ Updated secret ${secretName} in AWS Secrets Manager`));
      
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        // Secret doesn't exist, create it
        await this.client.send(new CreateSecretCommand({
          Name: secretName,
          SecretString: secret.value,
          Description: `Environment variable for ${projectConfig.projectName}`,
          Tags: [
            { Key: 'Project', Value: projectConfig.projectName },
            { Key: 'ManagedBy', Value: 'init-secrets' },
            { Key: 'Environment', Value: 'development' }
          ]
        }));
        
        console.log(chalk.green(`✅ Created secret ${secretName} in AWS Secrets Manager`));
      } else {
        throw new Error(`Failed to write secret ${secretName} to AWS Secrets Manager: ${error.message}`);
      }
    }
  }

  async finalize(projectConfig: ProjectConfig): Promise<void> {
    console.log(chalk.green(`🎉 All secrets for ${projectConfig.projectName} have been stored in AWS Secrets Manager!`));
    console.log(chalk.blue(`📍 Region: ${this.region}`));
    console.log(chalk.blue(`🏷️  Secret naming pattern: ${projectConfig.projectName}/<secret-name>`));
    console.log('-----------------------------');
  }
}

// Example of how to register this plugin
// In your main script, you would do:
// const initializer = new SecretInitializer();
// initializer.registerPlugin(new AwsSecretsPlugin('us-west-2')); 