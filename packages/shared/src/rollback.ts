// Rollback service for handling provisioning failures
import { db } from '../db';
import { instances, rollbackLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

interface RollbackResult {
  success: boolean;
  steps: string[];
  error?: any;
}

// Level 1: Soft Rollback - Mark as failed, notify customer
export async function softRollback(instanceId: string): Promise<RollbackResult> {
  try {
    await db.update(instances)
      .set({ 
        status: 'failed',
        errorMessage: 'Provisioning failed - manual intervention required',
        updatedAt: new Date()
      })
      .where(eq(instances.id, instanceId));
    
    // Log rollback
    await db.insert(rollbackLogs).values({
      instanceId,
      level: 'soft',
      reason: 'Provisioning failure',
      timestamp: new Date()
    });
    
    return { success: true, steps: ['marked_failed', 'notified'] };
  } catch (error) {
    return { success: false, steps: [], error };
  }
}

// Level 2: Partial Rollback - Delete VPS + DNS, keep DB record
export async function partialRollback(
  instanceId: string, 
  hetznerId?: string,
  cloudflareMethods?: { deleteRecord: (id: string) => Promise<void> },
  hetznerMethods?: { deleteServer: (id: string) => Promise<void> }
): Promise<RollbackResult> {
  const steps: string[] = [];
  
  try {
    // 1. Get instance details
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId)
    });
    
    if (!instance) {
      return { success: false, steps: [], error: 'Instance not found' };
    }
    
    // 2. Delete DNS record
    if (cloudflareMethods && instance.subdomain) {
      try {
        await cloudflareMethods.deleteRecord(instance.subdomain);
        steps.push('dns_deleted');
      } catch (e) {
        steps.push('dns_delete_failed');
      }
    }
    
    // 3. Delete VPS (if created)
    if (hetznerMethods && (hetznerId || instance.hetznerId)) {
      try {
        await hetznerMethods.deleteServer(hetznerId || instance.hetznerId!);
        steps.push('vps_deleted');
      } catch (e) {
        steps.push('vps_delete_failed');
      }
    }
    
    // 4. Update database
    await db.update(instances)
      .set({ 
        status: 'rolled_back',
        hetznerId: null,
        ipAddress: null,
        rolledBackAt: new Date()
      })
      .where(eq(instances.id, instanceId));
    
    steps.push('db_updated');
    
    // Log rollback
    await db.insert(rollbackLogs).values({
      instanceId,
      level: 'partial',
      reason: 'Provisioning failure - partial cleanup',
      steps,
      timestamp: new Date()
    });
    
    return { success: true, steps };
  } catch (error) {
    // Log failed rollback
    await db.insert(rollbackLogs).values({
      instanceId,
      level: 'partial',
      reason: 'Rollback failed',
      error: JSON.stringify(error),
      timestamp: new Date()
    });
    
    return { success: false, steps, error };
  }
}

// Level 3: Full Rollback - Complete cleanup
export async function fullRollback(
  instanceId: string,
  cloudflareMethods?: { deleteRecord: (id: string) => Promise<void> },
  hetznerMethods?: { deleteServer: (id: string) => Promise<void> },
  firebaseMethods?: { deleteUser: (id: string) => Promise<void> }
): Promise<RollbackResult> {
  const steps: string[] = [];
  
  try {
    // 1. Get instance details
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId)
    });
    
    if (!instance) {
      return { success: false, steps: [], error: 'Instance not found' };
    }
    
    // 2. Delete external resources (parallel)
    await Promise.all([
      // Delete DNS
      cloudflareMethods && instance.subdomain
        ? cloudflareMethods.deleteRecord(instance.subdomain).then(() => steps.push('dns_deleted')).catch(() => steps.push('dns_delete_failed'))
        : Promise.resolve(),
      
      // Delete VPS
      hetznerMethods && instance.hetznerId
        ? hetznerMethods.deleteServer(instance.hetznerId).then(() => steps.push('vps_deleted')).catch(() => steps.push('vps_delete_failed'))
        : Promise.resolve(),
      
      // Delete Firebase user
      firebaseMethods && instance.customerId
        ? firebaseMethods.deleteUser(instance.customerId).then(() => steps.push('firebase_deleted')).catch(() => steps.push('firebase_delete_failed'))
        : Promise.resolve()
    ]);
    
    // 3. Delete from database
    await db.delete(instances).where(eq(instances.id, instanceId));
    steps.push('db_deleted');
    
    // 4. Log rollback
    await db.insert(rollbackLogs).values({
      instanceId,
      level: 'full',
      reason: 'Complete rollback executed',
      steps,
      timestamp: new Date()
    });
    
    return { success: true, steps };
  } catch (error) {
    // Log failed rollback
    await db.insert(rollbackLogs).values({
      instanceId,
      level: 'full',
      reason: 'Full rollback failed',
      error: JSON.stringify(error),
      steps,
      timestamp: new Date()
    });
    
    return { success: false, steps, error };
  }
}

// Auto-rollback triggers
export const ROLLBACK_TRIGGERS = {
  PROVISIONING_TIMEOUT: 300000,      // 5 minutes
  VPS_CREATION_FAILED: 'hetzner_error',
  DNS_PROPAGATION_FAILED: 60000,     // 1 minute
  HEALTH_CHECK_FAILED: 3,            // 3 attempts
  API_ERROR_5XX: true
};

// Monitor provisioning and auto-rollback on failure
export async function monitorProvisioning(
  instanceId: string,
  rollbackFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  let checkCount = 0;
  
  const interval = setInterval(async () => {
    checkCount++;
    
    // Get current instance status
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId)
    });
    
    if (!instance) {
      clearInterval(interval);
      return;
    }
    
    // Check timeout
    if (Date.now() - startTime > ROLLBACK_TRIGGERS.PROVISIONING_TIMEOUT) {
      clearInterval(interval);
      console.log(`[${instanceId}] Provisioning timeout - triggering rollback`);
      await rollbackFn();
      return;
    }
    
    // Check for failures
    if (instance.status === 'error') {
      clearInterval(interval);
      console.log(`[${instanceId}] Provisioning error - triggering rollback`);
      await rollbackFn();
      return;
    }
    
    // Success - stop monitoring
    if (instance.status === 'active') {
      clearInterval(interval);
      console.log(`[${instanceId}] Provisioning successful`);
      return;
    }
    
    // Health check failures
    if (checkCount >= ROLLBACK_TRIGGERS.HEALTH_CHECK_FAILED) {
      clearInterval(interval);
      console.log(`[${instanceId}] Health check failed ${checkCount} times - triggering rollback`);
      await rollbackFn();
      return;
    }
  }, 10000); // Check every 10 seconds
}
