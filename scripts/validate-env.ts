#!/usr/bin/env tsx
/**
 * Environment Validation Script
 * Validates all required environment variables and API connections
 * Run with: pnpm validate-env or tsx scripts/validate-env.ts
 */

import { config } from 'dotenv';
import { z } from 'zod';
import chalk from 'chalk';

// Load environment variables
config();

// Environment validation schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url('Invalid PostgreSQL connection string'),
  REDIS_URL: z.string().url('Invalid Redis connection string'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),

  // API Keys
  DATAFORSEO_LOGIN: z.string().min(1, 'DataForSEO login is required'),
  DATAFORSEO_PASSWORD: z.string().min(1, 'DataForSEO password is required'),
  OPENAI_API_KEY: z.string().regex(/^sk-/, 'Invalid OpenAI API key format'),

  // Optional but recommended
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OPENAI_ORGANIZATION: z.string().optional(),
});

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

async function validateEnvironment(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  console.log(chalk.blue('🔍 Validating environment configuration...\n'));

  // 1. Validate environment variables
  try {
    const env = envSchema.parse(process.env);
    console.log(chalk.green('✅ All required environment variables are present'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.valid = false;
      error.errors.forEach((err) => {
        result.errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    }
  }

  // 2. Test database connection
  try {
    await testDatabaseConnection();
    console.log(chalk.green('✅ Database connection successful'));
  } catch (error) {
    result.valid = false;
    result.errors.push(`Database connection failed: ${error.message}`);
  }

  // 3. Test Redis connection
  try {
    await testRedisConnection();
    console.log(chalk.green('✅ Redis connection successful'));
  } catch (error) {
    result.valid = false;
    result.errors.push(`Redis connection failed: ${error.message}`);
  }

  // 4. Test DataForSEO API
  try {
    await testDataForSEOAPI();
    console.log(chalk.green('✅ DataForSEO API authentication successful'));
  } catch (error) {
    result.valid = false;
    result.errors.push(`DataForSEO API failed: ${error.message}`);
  }

  // 5. Test OpenAI API
  try {
    await testOpenAIAPI();
    console.log(chalk.green('✅ OpenAI API authentication successful'));
  } catch (error) {
    result.valid = false;
    result.errors.push(`OpenAI API failed: ${error.message}`);
  }

  // 6. Check optional configurations
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    result.warnings.push('Google OAuth not configured - SSO will not be available');
  }

  return result;
}

async function testDatabaseConnection(): Promise<void> {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } finally {
    await pool.end();
  }
}

async function testRedisConnection(): Promise<void> {
  const { createClient } = await import('redis');
  const client = createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    await client.ping();
  } finally {
    await client.disconnect();
  }
}

async function testDataForSEOAPI(): Promise<void> {
  const auth = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString('base64');

  const response = await fetch('https://api.dataforseo.com/v3/user', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status_code !== 20000) {
    throw new Error(`API error: ${data.status_message}`);
  }
}

async function testOpenAIAPI(): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }
}

function printResult(result: ValidationResult): void {
  console.log('\n' + '='.repeat(50));

  if (result.valid) {
    console.log(chalk.green.bold('🎉 Environment validation passed!'));
    console.log(chalk.green('Your deployment is ready to start.'));
  } else {
    console.log(chalk.red.bold('❌ Environment validation failed!'));
    console.log(chalk.red('Please fix the following issues:\n'));

    result.errors.forEach((error, index) => {
      console.log(chalk.red(`${index + 1}. ${error}`));
    });
  }

  if (result.warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warnings:'));
    result.warnings.forEach((warning, index) => {
      console.log(chalk.yellow(`${index + 1}. ${warning}`));
    });
  }

  console.log('\n' + '='.repeat(50));
}

// Generate secure secrets helper
function generateSecrets(): void {
  const crypto = require('crypto');

  console.log(chalk.blue('\n🔐 Generated secure secrets (save these in your .env file):\n'));
  console.log(`JWT_SECRET="${crypto.randomBytes(64).toString('hex')}"`);
  console.log(`NEXTAUTH_SECRET="${crypto.randomBytes(64).toString('hex')}"`);
  console.log('\n');
}

// Main execution
async function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--generate-secrets')) {
    generateSecrets();
    return;
  }

  try {
    const result = await validateEnvironment();
    printResult(result);

    if (!result.valid) {
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('💥 Validation script failed:'), error.message);
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}