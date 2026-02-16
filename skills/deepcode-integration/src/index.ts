import { DeepCodeClient } from './deepcode-client';
import { OpenClawClient } from './openclaw-client';
import { CodeReviewer } from './code-reviewer';
import { Deployer } from './deployer';
import { ConfigManager } from './config-manager';
import { Logger } from './logger';

interface SkillContext {
  userId: string;
  sessionId: string;
  config: Record<string, any>;
}

interface CommandArgs {
  command: string;
  prompt: string;
  options: Record<string, any>;
}

export class DeepCodeSkill {
  private deepcode: DeepCodeClient;
  private openclaw: OpenClawClient;
  private reviewer: CodeReviewer;
  private deployer: Deployer;
  private config: ConfigManager;
  private logger: Logger;

  constructor() {
    this.config = new ConfigManager();
    this.logger = new Logger();
    
    const deepcodeConfig = this.config.get('deepcode');
    const openclawConfig = this.config.get('openclaw');
    
    this.deepcode = new DeepCodeClient(deepcodeConfig);
    this.openclaw = new OpenClawClient(openclawConfig);
    this.reviewer = new CodeReviewer();
    this.deployer = new Deployer(this.openclaw);
  }

  async execute(command: string, args: string[], context: SkillContext): Promise<string> {
    this.logger.info(`Executing command: ${command}`, { userId: context.userId });

    try {
      switch (command) {
        case 'text2web':
          return await this.handleText2Web(args, context);
        case 'text2backend':
          return await this.handleText2Backend(args, context);
        case 'paper2code':
          return await this.handlePaper2Code(args, context);
        case 'fullstack':
          return await this.handleFullstack(args, context);
        case 'status':
          return await this.handleStatus(args, context);
        case 'deploy':
          return await this.handleDeploy(args, context);
        default:
          return this.getHelpMessage();
      }
    } catch (error) {
      this.logger.error(`Command failed: ${command}`, error);
      return `❌ Error: ${error.message}`;
    }
  }

  private async handleText2Web(args: string[], context: SkillContext): Promise<string> {
    const prompt = args.join(' ');
    const options = this.parseOptions(args);

    // 1. Generate code with DeepCode
    const generation = await this.deepcode.generate({
      type: 'text2web',
      prompt,
      options: {
        framework: options.framework || 'react',
        style: options.style || 'modern'
      }
    });

    // 2. Review code (if enabled)
    if (options.review !== 'false') {
      const review = await this.reviewer.review(generation.code);
      if (review.issues.length > 0) {
        return this.formatReviewResults(review);
      }
    }

    // 3. Deploy (if requested)
    if (options.deploy === 'true') {
      const deployment = await this.deployer.deploy({
        code: generation,
        projectName: this.generateProjectName(prompt),
        region: options.region || 'us-east-1',
        plan: options.plan || 'standard',
        domain: options.domain
      });

      return this.formatDeploymentResult(deployment);
    }

    return this.formatGenerationResult(generation);
  }

  private async handleText2Backend(args: string[], context: SkillContext): Promise<string> {
    const prompt = args.join(' ');
    const options = this.parseOptions(args);

    const generation = await this.deepcode.generate({
      type: 'text2backend',
      prompt,
      options: {
        framework: options.framework || 'hono',
        database: options.database || 'postgresql',
        auth: options.auth || 'jwt'
      }
    });

    if (options.deploy === 'true') {
      const deployment = await this.deployer.deploy({
        code: generation,
        projectName: this.generateProjectName(prompt),
        region: options.region || 'us-east-1',
        plan: options.plan || 'standard'
      });

      return this.formatDeploymentResult(deployment);
    }

    return this.formatGenerationResult(generation);
  }

  private async handlePaper2Code(args: string[], context: SkillContext): Promise<string> {
    const paperUrl = args[0];
    const options = this.parseOptions(args);

    const generation = await this.deepcode.generate({
      type: 'paper2code',
      prompt: paperUrl,
      options: {
        language: options.language || 'python',
        framework: options.framework || 'pytorch'
      }
    });

    if (options.deploy === 'true') {
      const deployment = await this.deployer.deploy({
        code: generation,
        projectName: `paper-${this.extractPaperId(paperUrl)}`,
        region: options.region || 'us-east-1',
        plan: options.plan || 'premium' // Papers often need more resources
      });

      return this.formatDeploymentResult(deployment);
    }

    return this.formatGenerationResult(generation);
  }

  private async handleFullstack(args: string[], context: SkillContext): Promise<string> {
    const prompt = args.join(' ');
    const options = this.parseOptions(args);

    // Generate both frontend and backend
    const [frontend, backend] = await Promise.all([
      this.deepcode.generate({
        type: 'text2web',
        prompt: `${prompt} - Frontend`,
        options: { framework: options.frontend || 'react' }
      }),
      this.deepcode.generate({
        type: 'text2backend',
        prompt: `${prompt} - Backend API`,
        options: {
          framework: options.backend || 'hono',
          database: options.database || 'postgresql'
        }
      })
    ]);

    // Combine into fullstack project
    const fullstack = {
      code: { ...frontend.code, ...backend.code },
      files: [...frontend.files, ...backend.files],
      dependencies: [...frontend.dependencies, ...backend.dependencies],
      estimatedComplexity: this.calculateComplexity(frontend, backend)
    };

    if (options.deploy === 'true') {
      const deployment = await this.deployer.deploy({
        code: fullstack,
        projectName: this.generateProjectName(prompt),
        region: options.region || 'us-east-1',
        plan: options.plan || 'standard'
      });

      return this.formatDeploymentResult(deployment);
    }

    return this.formatGenerationResult(fullstack);
  }

  private async handleStatus(args: string[], context: SkillContext): Promise<string> {
    const jobId = args[0];
    const status = await this.deepcode.checkStatus(jobId);

    return `📊 Job Status: ${status.state}
${status.progress ? `Progress: ${status.progress}%` : ''}
${status.message ? `Message: ${status.message}` : ''}`;
  }

  private async handleDeploy(args: string[], context: SkillContext): Promise<string> {
    const jobId = args[0];
    const options = this.parseOptions(args);

    // Retrieve generated code
    const generation = await this.deepcode.getResult(jobId);

    const deployment = await this.deployer.deploy({
      code: generation,
      projectName: options.name || `deployment-${jobId}`,
      region: options.region || 'us-east-1',
      plan: options.plan || 'standard'
    });

    return this.formatDeploymentResult(deployment);
  }

  private parseOptions(args: string[]): Record<string, string> {
    const options: Record<string, string> = {};
    
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
        options[key] = value;
      }
    }

    return options;
  }

  private generateProjectName(prompt: string): string {
    // Extract keywords and generate project name
    const keywords = prompt.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 3);
    
    const timestamp = Date.now().toString(36);
    return `${keywords.join('-')}-${timestamp}`;
  }

  private extractPaperId(url: string): string {
    const match = url.match(/\/(\d+\.\d+)$/);
    return match ? match[1] : 'unknown';
  }

  private calculateComplexity(frontend: any, backend: any): string {
    const scores = {
      'low': 1,
      'medium': 2,
      'high': 3
    };
    
    const total = scores[frontend.estimatedComplexity] + scores[backend.estimatedComplexity];
    
    if (total <= 2) return 'low';
    if (total <= 4) return 'medium';
    return 'high';
  }

  private formatGenerationResult(generation: any): string {
    return `✅ Code Generated Successfully!

📁 Files: ${generation.files.length}
📦 Dependencies: ${generation.dependencies.length}
📊 Complexity: ${generation.estimatedComplexity}

To deploy, run:
@deepcode deploy JOB_ID --deploy=true`;
  }

  private formatDeploymentResult(deployment: any): string {
    return `🚀 Deployment Successful!

🌐 URL: ${deployment.url}
📊 Status: ${deployment.status}
💻 Resources: ${JSON.stringify(deployment.resources)}

Your application is now live!`;
  }

  private formatReviewResults(review: any): string {
    return `⚠️ Code Review Results:

Issues found: ${review.issues.length}
${review.issues.map((i: any) => `- ${i.severity}: ${i.message}`).join('\n')}

Please review before deploying.`;
  }

  private getHelpMessage(): string {
    return `🤖 DeepCode Integration Skill

Available commands:
• @deepcode text2web "description" --deploy=true
• @deepcode text2backend "description" --deploy=true
• @deepcode paper2code "https://arxiv.org/..." --deploy=true
• @deepcode fullstack "description" --deploy=true
• @deepcode status JOB_ID
• @deepcode deploy JOB_ID

Options:
--framework    react, vue, svelte, nextjs
--style        minimal, glassmorphism, dark
--database     postgresql, mysql, mongodb
--auth         jwt, oauth, session
--region       us-east-1, eu-west-1, etc.
--plan         standard, premium, enterprise`;
  }
}

// Export for OpenClaw skill system
export default DeepCodeSkill;
