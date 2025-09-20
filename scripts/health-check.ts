#!/usr/bin/env tsx
/**
 * Health Check and Monitoring Dashboard
 * Comprehensive health monitoring for SEO Portal deployment
 * Run with: pnpm health-check or tsx scripts/health-check.ts
 */

import { config } from 'dotenv';
import chalk from 'chalk';

// Load environment variables
config();

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
  responseTime?: number;
}

interface SystemInfo {
  deployment: string;
  version: string;
  uptime: string;
  environment: string;
}

class HealthMonitor {
  private results: HealthCheckResult[] = [];
  private startTime: number = Date.now();

  async runHealthCheck(): Promise<void> {
    console.log(chalk.blue.bold('🏥 SEO Portal Health Check Dashboard\n'));

    // System Information
    await this.displaySystemInfo();

    // Run all health checks
    await this.checkDatabase();
    await this.checkRedis();
    await this.checkDataForSEOAPI();
    await this.checkOpenAIAPI();
    await this.checkWebServer();
    await this.checkAPIServer();
    await this.checkDiskSpace();
    await this.checkMemoryUsage();

    // Display results
    this.displayResults();
    this.displaySummary();
  }

  private async displaySystemInfo(): Promise<void> {
    const packageJson = require('../package.json');
    const info: SystemInfo = {
      deployment: this.detectDeploymentType(),
      version: packageJson.version || '1.0.0',
      uptime: this.formatUptime(process.uptime()),
      environment: process.env.NODE_ENV || 'development'
    };

    console.log(chalk.cyan('📊 System Information'));
    console.log(chalk.gray(`Deployment: ${info.deployment}`));
    console.log(chalk.gray(`Version: ${info.version}`));
    console.log(chalk.gray(`Environment: ${info.environment}`));
    console.log(chalk.gray(`Uptime: ${info.uptime}`));
    console.log('');
  }

  private detectDeploymentType(): string {
    if (process.env.RAILWAY_ENVIRONMENT) return 'Railway';
    if (process.env.RENDER) return 'Render';
    if (process.env.VERCEL) return 'Vercel';
    if (process.env.DOCKER) return 'Docker';
    if (process.env.NODE_ENV === 'production') return 'Production';
    return 'Development';
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  private async checkDatabase(): Promise<void> {
    const startTime = Date.now();

    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      const client = await pool.connect();
      const result = await client.query('SELECT version(), now() as current_time');
      const responseTime = Date.now() - startTime;

      client.release();
      await pool.end();

      this.results.push({
        service: 'PostgreSQL Database',
        status: 'healthy',
        message: 'Connection successful',
        responseTime,
        details: {
          version: result.rows[0].version.split(' ')[1],
          currentTime: result.rows[0].current_time
        }
      });
    } catch (error) {
      this.results.push({
        service: 'PostgreSQL Database',
        status: 'unhealthy',
        message: error.message,
        responseTime: Date.now() - startTime
      });
    }
  }

  private async checkRedis(): Promise<void> {
    const startTime = Date.now();

    try {
      const { createClient } = await import('redis');
      const client = createClient({
        url: process.env.REDIS_URL,
      });

      await client.connect();
      const pong = await client.ping();
      const info = await client.info('memory');
      const responseTime = Date.now() - startTime;

      await client.disconnect();

      // Parse Redis memory info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const maxMemoryMatch = info.match(/maxmemory_human:([^\r\n]+)/);

      this.results.push({
        service: 'Redis Cache',
        status: 'healthy',
        message: 'Connection successful',
        responseTime,
        details: {
          ping: pong,
          memoryUsed: memoryMatch ? memoryMatch[1] : 'Unknown',
          memoryMax: maxMemoryMatch ? maxMemoryMatch[1] : 'Unknown'
        }
      });
    } catch (error) {
      this.results.push({
        service: 'Redis Cache',
        status: 'unhealthy',
        message: error.message,
        responseTime: Date.now() - startTime
      });
    }
  }

  private async checkDataForSEOAPI(): Promise<void> {
    const startTime = Date.now();

    try {
      if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
        this.results.push({
          service: 'DataForSEO API',
          status: 'warning',
          message: 'API credentials not configured',
          responseTime: 0
        });
        return;
      }

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

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (data.status_code === 20000) {
        const credits = data.tasks?.[0]?.result?.[0]?.money || {};
        this.results.push({
          service: 'DataForSEO API',
          status: 'healthy',
          message: 'Authentication successful',
          responseTime,
          details: {
            balance: credits.balance || 'Unknown',
            currency: credits.currency || 'USD',
            limit: credits.limit || 'Unknown'
          }
        });
      } else {
        this.results.push({
          service: 'DataForSEO API',
          status: 'unhealthy',
          message: `API error: ${data.status_message}`,
          responseTime
        });
      }
    } catch (error) {
      this.results.push({
        service: 'DataForSEO API',
        status: 'unhealthy',
        message: error.message,
        responseTime: Date.now() - startTime
      });
    }
  }

  private async checkOpenAIAPI(): Promise<void> {
    const startTime = Date.now();

    try {
      if (!process.env.OPENAI_API_KEY) {
        this.results.push({
          service: 'OpenAI API',
          status: 'warning',
          message: 'API key not configured',
          responseTime: 0
        });
        return;
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const gpt4Available = data.data.some(model => model.id.includes('gpt-4'));

        this.results.push({
          service: 'OpenAI API',
          status: 'healthy',
          message: 'Authentication successful',
          responseTime,
          details: {
            modelsAvailable: data.data.length,
            gpt4Available,
            organization: process.env.OPENAI_ORGANIZATION || 'Default'
          }
        });
      } else {
        this.results.push({
          service: 'OpenAI API',
          status: 'unhealthy',
          message: `API error: ${response.status} ${response.statusText}`,
          responseTime
        });
      }
    } catch (error) {
      this.results.push({
        service: 'OpenAI API',
        status: 'unhealthy',
        message: error.message,
        responseTime: Date.now() - startTime
      });
    }
  }

  private async checkWebServer(): Promise<void> {
    const startTime = Date.now();
    const webUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';

    try {
      const response = await fetch(webUrl, {
        method: 'HEAD',
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;

      this.results.push({
        service: 'Web Server (Frontend)',
        status: response.ok ? 'healthy' : 'unhealthy',
        message: response.ok ? 'Server responding' : `HTTP ${response.status}`,
        responseTime,
        details: {
          url: webUrl,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    } catch (error) {
      this.results.push({
        service: 'Web Server (Frontend)',
        status: 'unhealthy',
        message: error.message,
        responseTime: Date.now() - startTime,
        details: { url: webUrl }
      });
    }
  }

  private async checkAPIServer(): Promise<void> {
    const startTime = Date.now();
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const healthUrl = `${apiUrl}/health`;

    try {
      const response = await fetch(healthUrl, {
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;
      const data = response.ok ? await response.json() : null;

      this.results.push({
        service: 'API Server (Backend)',
        status: response.ok ? 'healthy' : 'unhealthy',
        message: response.ok ? 'Health check passed' : `HTTP ${response.status}`,
        responseTime,
        details: {
          url: healthUrl,
          status: response.status,
          health: data
        }
      });
    } catch (error) {
      this.results.push({
        service: 'API Server (Backend)',
        status: 'unhealthy',
        message: error.message,
        responseTime: Date.now() - startTime,
        details: { url: healthUrl }
      });
    }
  }

  private async checkDiskSpace(): Promise<void> {
    try {
      const fs = await import('fs');
      const stats = fs.statSync(process.cwd());

      // This is a simplified check - in production you'd want to check actual disk usage
      this.results.push({
        service: 'Disk Space',
        status: 'healthy',
        message: 'Disk accessible',
        details: {
          note: 'Run `df -h` on server for detailed disk usage'
        }
      });
    } catch (error) {
      this.results.push({
        service: 'Disk Space',
        status: 'warning',
        message: 'Could not check disk space'
      });
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal / 1024 / 1024; // MB
    const usedMem = memUsage.heapUsed / 1024 / 1024; // MB
    const usage = (usedMem / totalMem) * 100;

    let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy';
    let message = 'Memory usage normal';

    if (usage > 90) {
      status = 'unhealthy';
      message = 'High memory usage';
    } else if (usage > 75) {
      status = 'warning';
      message = 'Elevated memory usage';
    }

    this.results.push({
      service: 'Memory Usage',
      status,
      message,
      details: {
        heapUsed: `${usedMem.toFixed(2)} MB`,
        heapTotal: `${totalMem.toFixed(2)} MB`,
        usage: `${usage.toFixed(1)}%`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`
      }
    });
  }

  private displayResults(): void {
    console.log(chalk.cyan('🔍 Health Check Results\n'));

    this.results.forEach((result, index) => {
      const statusIcon = this.getStatusIcon(result.status);
      const statusColor = this.getStatusColor(result.status);
      const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';

      console.log(`${statusIcon} ${statusColor(result.service)}`);
      console.log(`   ${result.message}${responseTime}`);

      if (result.details && Object.keys(result.details).length > 0) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(chalk.gray(`   ${key}: ${value}`));
        });
      }

      if (index < this.results.length - 1) console.log('');
    });
  }

  private displaySummary(): void {
    const healthy = this.results.filter(r => r.status === 'healthy').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const unhealthy = this.results.filter(r => r.status === 'unhealthy').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(50));
    console.log(chalk.cyan.bold('📋 Health Check Summary'));
    console.log('');

    console.log(`${chalk.green('✅ Healthy')}: ${healthy}/${total}`);
    if (warnings > 0) console.log(`${chalk.yellow('⚠️  Warnings')}: ${warnings}/${total}`);
    if (unhealthy > 0) console.log(`${chalk.red('❌ Unhealthy')}: ${unhealthy}/${total}`);

    console.log('');

    if (unhealthy === 0 && warnings === 0) {
      console.log(chalk.green.bold('🎉 All systems operational!'));
    } else if (unhealthy === 0) {
      console.log(chalk.yellow.bold('⚠️  Some warnings detected'));
      console.log(chalk.yellow('Your application is running but has minor issues.'));
    } else {
      console.log(chalk.red.bold('🚨 Critical issues detected'));
      console.log(chalk.red('Your application may not function correctly.'));
    }

    console.log('');
    console.log(chalk.gray(`Total check time: ${Date.now() - this.startTime}ms`));
    console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}`));
    console.log('='.repeat(50));
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'healthy': return chalk.green('✅');
      case 'warning': return chalk.yellow('⚠️');
      case 'unhealthy': return chalk.red('❌');
      default: return '⭕';
    }
  }

  private getStatusColor(status: string): typeof chalk.green {
    switch (status) {
      case 'healthy': return chalk.green;
      case 'warning': return chalk.yellow;
      case 'unhealthy': return chalk.red;
      default: return chalk.gray;
    }
  }
}

// Command line interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.blue.bold('🏥 SEO Portal Health Check\n'));
    console.log('Usage: tsx scripts/health-check.ts [options]\n');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --continuous   Run health checks continuously');
    console.log('  --interval     Set interval for continuous mode (default: 30s)');
    console.log('\nExamples:');
    console.log('  tsx scripts/health-check.ts');
    console.log('  tsx scripts/health-check.ts --continuous --interval 60');
    return;
  }

  const monitor = new HealthMonitor();

  if (args.includes('--continuous')) {
    const intervalArg = args.indexOf('--interval');
    const interval = intervalArg !== -1 && args[intervalArg + 1]
      ? parseInt(args[intervalArg + 1]) * 1000
      : 30000; // 30 seconds default

    console.log(chalk.blue(`🔄 Running continuous health checks every ${interval/1000}s\n`));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    // Run initial check
    await monitor.runHealthCheck();

    // Set up interval
    setInterval(async () => {
      console.clear();
      await monitor.runHealthCheck();
    }, interval);
  } else {
    await monitor.runHealthCheck();
  }
}

// Run the health check
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('💥 Health check failed:'), error.message);
    process.exit(1);
  });
}