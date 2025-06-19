
import chalk from 'chalk';
import { SecretPlugin, SecretValue, ProjectConfig } from '../init-secrets';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

// File writer plugin
export class EnvFilePlugin implements SecretPlugin {
    name = 'env-file';
    private envFile: string;
  
    async initialize(projectConfig: ProjectConfig): Promise<void> {
        this.envFile = projectConfig.config?.envFile?.filename || '.env';

      console.log(chalk.cyan(`📝 Initializing ${this.envFile} file for ${projectConfig.projectName}`));
    }
  
    async writeSecret(secret: SecretValue, projectConfig: ProjectConfig): Promise<void> {
      const envPath = join(projectConfig.projectDir, this.envFile);
      
      try {
        let envContent = '';
        if (existsSync(envPath)) {
          envContent = readFileSync(envPath, 'utf-8');
        }
  
        const lines = envContent.split('\n');
        const existingIndex = lines.findIndex(line => line.startsWith(`${secret.name}=`));
  
        if (existingIndex >= 0) {
          lines[existingIndex] = `${secret.name}=${secret.value}`;
          console.log(chalk.green(`✅ Updated ${secret.name} in ${this.envFile}`));
        } else {
          lines.push(`${secret.name}=${secret.value}`);
          console.log(chalk.green(`✅ Added ${secret.name} to ${this.envFile}`));
        }
  
        const { writeFileSync } = await import('fs');
        writeFileSync(envPath, lines.filter(line => line.trim()).join('\n') + '\n');
      } catch (error) {
        throw new Error(`Failed to write ${secret.name} to ${this.envFile}: ${error}`);
      }
    }

  async finalize(projectConfig: ProjectConfig): Promise<void> {
    console.log(chalk.green(`🎉 All environment variables for ${projectConfig.projectName} have been written to ${this.envFile}!`));
    console.log('-----------------------------');
  }
}
