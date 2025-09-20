#!/usr/bin/env tsx
/**
 * Setup Wizard
 * Interactive setup process for configuring the SEO Portal
 * Run with: pnpm setup or tsx scripts/setup-wizard.ts
 */

import { createRequire } from 'module';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const require = createRequire(import.meta.url);
const inquirer = require('inquirer');
const crypto = require('crypto');

interface SetupConfig {
  deploymentType: 'local' | 'railway' | 'render' | 'docker' | 'vercel';
  useExistingEnv: boolean;
  database: {
    url: string;
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
  };
  redis: {
    url: string;
    host?: string;
    port?: string;
  };
  auth: {
    jwtSecret: string;
    nextauthSecret: string;
    nextauthUrl: string;
  };
  apis: {
    dataforSEO: {
      login: string;
      password: string;
    };
    openAI: {
      apiKey: string;
      organization?: string;
    };
    google?: {
      clientId: string;
      clientSecret: string;
    };
  };
}

async function setupWizard(): Promise<void> {
  console.log(chalk.blue.bold('🚀 SEO Portal Setup Wizard\n'));
  console.log(chalk.gray('This wizard will help you configure your SEO Portal deployment.\n'));

  const config: SetupConfig = {
    deploymentType: 'local',
    useExistingEnv: false,
    database: { url: '' },
    redis: { url: '' },
    auth: {
      jwtSecret: generateSecret(),
      nextauthSecret: generateSecret(),
      nextauthUrl: 'http://localhost:3000'
    },
    apis: {
      dataforSEO: { login: '', password: '' },
      openAI: { apiKey: '' }
    }
  };

  // Step 1: Check for existing .env file
  if (existsSync('.env')) {
    const { useExisting } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useExisting',
        message: 'Found existing .env file. Do you want to update it?',
        default: true
      }
    ]);
    config.useExistingEnv = useExisting;
  }

  // Step 2: Deployment type
  const { deploymentType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'deploymentType',
      message: 'What type of deployment are you setting up?',
      choices: [
        { name: '🖥️  Local Development', value: 'local' },
        { name: '🚄 Railway (Easiest)', value: 'railway' },
        { name: '🎨 Render', value: 'render' },
        { name: '🐳 Docker (VPS)', value: 'docker' },
        { name: '▲ Vercel (Frontend only)', value: 'vercel' }
      ]
    }
  ]);
  config.deploymentType = deploymentType;

  // Step 3: Database configuration
  await configureDatabaseAndRedis(config);

  // Step 4: API keys
  await configureAPIs(config);

  // Step 5: Authentication
  await configureAuth(config);

  // Step 6: Generate environment file
  await generateEnvironmentFile(config);

  // Step 7: Next steps
  await showNextSteps(config);
}

async function configureDatabaseAndRedis(config: SetupConfig): Promise<void> {
  console.log(chalk.yellow('\n📊 Database & Cache Configuration'));

  if (config.deploymentType === 'local') {
    console.log(chalk.gray('For local development, we\'ll use Docker containers.'));
    config.database.url = 'postgresql://postgres:postgres@localhost:5432/seo_portal';
    config.redis.url = 'redis://localhost:6379';
    return;
  }

  const { databaseType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'databaseType',
      message: 'How do you want to configure your database?',
      choices: [
        { name: 'Use managed database (Recommended)', value: 'managed' },
        { name: 'Provide custom connection string', value: 'custom' },
        { name: 'Configure manually', value: 'manual' }
      ]
    }
  ]);

  if (databaseType === 'custom') {
    const { databaseUrl, redisUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'databaseUrl',
        message: 'PostgreSQL connection string:',
        validate: (input) => input.startsWith('postgresql://') || 'Must be a valid PostgreSQL URL'
      },
      {
        type: 'input',
        name: 'redisUrl',
        message: 'Redis connection string:',
        validate: (input) => input.startsWith('redis://') || 'Must be a valid Redis URL'
      }
    ]);
    config.database.url = databaseUrl;
    config.redis.url = redisUrl;
  } else if (databaseType === 'manual') {
    const dbConfig = await inquirer.prompt([
      { type: 'input', name: 'host', message: 'Database host:', default: 'localhost' },
      { type: 'input', name: 'port', message: 'Database port:', default: '5432' },
      { type: 'input', name: 'database', message: 'Database name:', default: 'seo_portal' },
      { type: 'input', name: 'username', message: 'Database username:', default: 'postgres' },
      { type: 'password', name: 'password', message: 'Database password:' }
    ]);

    const redisConfig = await inquirer.prompt([
      { type: 'input', name: 'host', message: 'Redis host:', default: 'localhost' },
      { type: 'input', name: 'port', message: 'Redis port:', default: '6379' }
    ]);

    config.database = {
      ...dbConfig,
      url: `postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
    };
    config.redis = {
      ...redisConfig,
      url: `redis://${redisConfig.host}:${redisConfig.port}`
    };
  }
}

async function configureAPIs(config: SetupConfig): Promise<void> {
  console.log(chalk.yellow('\n🔑 API Configuration'));

  // DataForSEO API
  const dataforSEO = await inquirer.prompt([
    {
      type: 'input',
      name: 'login',
      message: 'DataForSEO login/username:',
      validate: (input) => input.length > 0 || 'DataForSEO login is required'
    },
    {
      type: 'password',
      name: 'password',
      message: 'DataForSEO password:',
      validate: (input) => input.length > 0 || 'DataForSEO password is required'
    }
  ]);
  config.apis.dataforSEO = dataforSEO;

  // OpenAI API
  const openAI = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: 'OpenAI API key (sk-...):',
      validate: (input) => input.startsWith('sk-') || 'Must be a valid OpenAI API key'
    },
    {
      type: 'input',
      name: 'organization',
      message: 'OpenAI Organization ID (optional):'
    }
  ]);
  config.apis.openAI = openAI;

  // Google OAuth (optional)
  const { useGoogleOAuth } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useGoogleOAuth',
      message: 'Do you want to configure Google OAuth for SSO?',
      default: false
    }
  ]);

  if (useGoogleOAuth) {
    const google = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientId',
        message: 'Google OAuth Client ID:',
        validate: (input) => input.includes('.googleusercontent.com') || 'Must be a valid Google Client ID'
      },
      {
        type: 'password',
        name: 'clientSecret',
        message: 'Google OAuth Client Secret:'
      }
    ]);
    config.apis.google = google;
  }
}

async function configureAuth(config: SetupConfig): Promise<void> {
  console.log(chalk.yellow('\n🔐 Authentication Configuration'));

  if (config.deploymentType !== 'local') {
    const { nextauthUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'nextauthUrl',
        message: 'Your application URL (for authentication):',
        default: 'https://your-domain.com',
        validate: (input) => input.startsWith('http') || 'Must be a valid URL'
      }
    ]);
    config.auth.nextauthUrl = nextauthUrl;
  }

  console.log(chalk.green('✅ Security secrets have been auto-generated'));
}

async function generateEnvironmentFile(config: SetupConfig): Promise<void> {
  console.log(chalk.yellow('\n📝 Generating Environment Configuration'));

  const envContent = generateEnvContent(config);
  const envFile = config.useExistingEnv ? '.env' : '.env.local';

  writeFileSync(envFile, envContent);
  console.log(chalk.green(`✅ Environment file created: ${envFile}`));

  // Create backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(`.env.backup.${timestamp}`, envContent);
  console.log(chalk.gray(`📋 Backup created: .env.backup.${timestamp}`));
}

function generateEnvContent(config: SetupConfig): string {
  const lines = [
    '# SEO Portal Environment Configuration',
    `# Generated on ${new Date().toISOString()}`,
    `# Deployment type: ${config.deploymentType}`,
    '',
    '# Database Configuration',
    `DATABASE_URL="${config.database.url}"`,
    '',
    '# Redis Configuration',
    `REDIS_URL="${config.redis.url}"`,
    '',
    '# Server Configuration',
    `NODE_ENV="${config.deploymentType === 'local' ? 'development' : 'production'}"`,
    'PORT="3001"',
    'HOST="0.0.0.0"',
    '',
    '# Authentication & Security',
    `JWT_SECRET="${config.auth.jwtSecret}"`,
    `NEXTAUTH_SECRET="${config.auth.nextauthSecret}"`,
    `NEXTAUTH_URL="${config.auth.nextauthUrl}"`,
    '',
    '# DataForSEO API Configuration',
    `DATAFORSEO_LOGIN="${config.apis.dataforSEO.login}"`,
    `DATAFORSEO_PASSWORD="${config.apis.dataforSEO.password}"`,
    'DATAFORSEO_BASE_URL="https://api.dataforseo.com"',
    '',
    '# OpenAI API Configuration',
    `OPENAI_API_KEY="${config.apis.openAI.apiKey}"`
  ];

  if (config.apis.openAI.organization) {
    lines.push(`OPENAI_ORGANIZATION="${config.apis.openAI.organization}"`);
  }

  if (config.apis.google) {
    lines.push(
      '',
      '# Google OAuth Configuration',
      `GOOGLE_CLIENT_ID="${config.apis.google.clientId}"`,
      `GOOGLE_CLIENT_SECRET="${config.apis.google.clientSecret}"`
    );
  }

  lines.push(
    '',
    '# Rate Limiting Configuration',
    'RATE_LIMIT_MAX="100"',
    'RATE_LIMIT_WINDOW="900000"',
    '',
    '# Application URLs',
    `API_BASE_URL="${config.deploymentType === 'local' ? 'http://localhost:3001' : 'https://your-api-domain.com'}"`,
    `WEB_BASE_URL="${config.auth.nextauthUrl}"`
  );

  return lines.join('\n') + '\n';
}

async function showNextSteps(config: SetupConfig): Promise<void> {
  console.log(chalk.green.bold('\n🎉 Setup Complete!\n'));

  const steps = [
    '1. 📝 Review your .env file and update any placeholder values',
    '2. 🧪 Run validation: pnpm validate-env',
  ];

  switch (config.deploymentType) {
    case 'local':
      steps.push(
        '3. 🐳 Start services: pnpm docker:dev',
        '4. 🗄️  Run migrations: pnpm db:migrate',
        '5. 🚀 Start development: pnpm dev'
      );
      break;
    case 'railway':
      steps.push(
        '3. 🚄 Deploy to Railway: Connect your GitHub repo',
        '4. 🔧 Set environment variables in Railway dashboard',
        '5. 🗄️  Run migrations after deployment'
      );
      break;
    case 'render':
      steps.push(
        '3. 🎨 Deploy to Render: Use the render.yaml configuration',
        '4. 🗄️  Run migrations after deployment'
      );
      break;
    case 'docker':
      steps.push(
        '3. 🐳 Build and deploy: docker-compose -f infra/docker/docker-compose.prod.yml up -d',
        '4. 🗄️  Run migrations: docker exec -it seo-portal-server-prod pnpm db:migrate'
      );
      break;
    case 'vercel':
      steps.push(
        '3. ▲ Deploy to Vercel: Connect your GitHub repo',
        '4. 🔧 Configure environment variables in Vercel dashboard',
        '5. 🔗 Set up backend deployment separately'
      );
      break;
  }

  steps.forEach(step => console.log(chalk.blue(step)));

  console.log(chalk.yellow('\n📚 Documentation:'));
  console.log(chalk.gray('- Deployment guides: docs/deployment/'));
  console.log(chalk.gray('- API documentation: docs/api/'));
  console.log(chalk.gray('- Troubleshooting: docs/troubleshooting.md'));

  console.log(chalk.green('\n✨ Happy coding!'));
}

function generateSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

// Main execution
async function main(): void {
  try {
    await setupWizard();
  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('💥 Setup wizard requires an interactive terminal'));
    } else {
      console.error(chalk.red('💥 Setup failed:'), error.message);
    }
    process.exit(1);
  }
}

// Run the setup wizard
if (require.main === module) {
  main();
}