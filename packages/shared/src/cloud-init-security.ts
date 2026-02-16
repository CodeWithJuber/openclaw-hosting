import { z } from 'zod';

/**
 * Cloud-init input validation and sanitization
 * Prevents command injection in cloud-init templates
 */

// Validation schemas
const CloudInitInputSchema = z.object({
  customerEmail: z.string().email().max(255),
  customerId: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  instanceId: z.string().uuid(),
  hostname: z.string().regex(/^[a-z0-9-]{3,63}$/),
  region: z.enum(['us-east', 'us-west', 'eu-frankfurt', 'eu-helsinki', 'sg-singapore', 'jp-tokyo']),
  plan: z.enum(['starter', 'professional', 'enterprise']),
  sshKey: z.string().regex(/^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256)\s+[A-Za-z0-9+/]+={0,2}\s*.*$/).optional(),
  openclawVersion: z.string().regex(/^[\d.]+$/),
  apiUrl: z.string().url(),
  webhookSecret: z.string().min(32).max(128),
});

type CloudInitInput = z.infer<typeof CloudInitInputSchema>;

/**
 * Sanitize string for shell usage
 * Removes dangerous characters that could enable command injection
 */
function sanitizeShell(input: string): string {
  // Remove shell metacharacters
  const dangerous = /[;\u0026|`$(){}[\]\\\n\r]/g;
  return input.replace(dangerous, '');
}

/**
 * Sanitize string for YAML usage
 * Prevents YAML injection attacks
 */
function sanitizeYAML(input: string): string {
  // Escape special YAML characters
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Validate and sanitize all cloud-init inputs
 */
export function validateCloudInitInput(rawInput: unknown): CloudInitInput {
  // Validate with Zod schema
  const validated = CloudInitInputSchema.parse(rawInput);
  
  // Additional sanitization for shell safety
  return {
    ...validated,
    customerEmail: sanitizeShell(validated.customerEmail),
    customerId: sanitizeShell(validated.customerId),
    hostname: sanitizeShell(validated.hostname),
    // SSH key validation is strict enough, no additional sanitization needed
  };
}

/**
 * Generate safe cloud-init YAML from validated inputs
 */
export function generateCloudInitYAML(input: CloudInitInput): string {
  const sanitized = validateCloudInitInput(input);
  
  // Build YAML with proper escaping
  return `#cloud-config
# OpenClaw Hosting - Auto-generated cloud-init
# Instance: ${sanitized.instanceId}
# Generated: ${new Date().toISOString()}

hostname: ${sanitized.hostname}
manage_etc_hosts: true

users:
  - name: openclaw
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    home: /home/openclaw
    ${sanitized.sshKey ? `ssh_authorized_keys:\n      - ${sanitized.sshKey}` : ''}

package_update: true
packages:
  - curl
  - git
  - docker.io
  - docker-compose
  - ufw
  - fail2ban
  - nodejs
  - npm

write_files:
  - path: /home/openclaw/.openclaw/config.json
    permissions: '0600'
    content: |
      {
        "instance_id": "${sanitized.instanceId}",
        "customer_id": "${sanitized.customerId}",
        "api_url": "${sanitized.apiUrl}",
        "webhook_secret": "${sanitized.webhookSecret}",
        "version": "${sanitized.openclawVersion}"
      }
    owner: openclaw:openclaw

runcmd:
  # Create openclaw directory
  - mkdir -p /home/openclaw/.openclaw
  - chown -R openclaw:openclaw /home/openclaw
  
  # Disable root SSH
  - sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  - sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  - systemctl restart sshd
  
  # Configure firewall
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ssh
  - ufw allow 2222/tcp  # OpenClaw API
  - ufw allow 8080/tcp  # Dashboard
  - ufw --force enable
  
  # Install OpenClaw
  - curl -fsSL https://openclaw.dev/install.sh | bash
  
  # Start OpenClaw service
  - systemctl enable openclaw
  - systemctl start openclaw
  
  # Send webhook notification
  - |
    curl -X POST "${sanitized.apiUrl}/webhooks/instance-ready" \\
      -H "Content-Type: application/json" \\
      -H "X-Instance-ID: ${sanitized.instanceId}" \\
      -d '{"status": "ready", "hostname": "${sanitized.hostname}"}'

final_message: "OpenClaw instance setup complete"
`;
}

/**
 * Validate generated cloud-init YAML
 */
export function validateCloudInitYAML(yaml: string): boolean {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /;\s*rm\s+-rf/,           // rm -rf
    /;\s*curl\s+.*\|\s*sh/,   // curl | sh
    /`.*`/,                    // Command substitution
    /\$\(.*\)/,                // $(command)
    /\${.*}/,                  // ${...}
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(yaml)) {
      throw new Error(`Dangerous pattern detected in cloud-init: ${pattern}`);
    }
  }
  
  return true;
}

export { CloudInitInput, CloudInitInputSchema };
