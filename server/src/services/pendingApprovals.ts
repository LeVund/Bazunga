import type { ShellApprovalRequest, ShellExecuteResult } from "@core/types";

export interface PendingApprovalResult {
  decision: "approve" | "always_approve" | "reject";
  result?: ShellExecuteResult;
}

interface PendingApproval {
  request: ShellApprovalRequest;
  resolve: (result: PendingApprovalResult) => void;
  reject: (error: Error) => void;
  createdAt: number;
}

// Map des approbations en attente
const pendingApprovals = new Map<string, PendingApproval>();

// Timeout pour les approbations (5 minutes)
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Enregistre une nouvelle approbation en attente et retourne une Promise
 * qui sera résolue quand l'utilisateur approuve/rejette
 */
export function waitForApproval(
  request: ShellApprovalRequest
): Promise<PendingApprovalResult> {
  return new Promise((resolve, reject) => {
    // Créer l'entrée pending
    const pending: PendingApproval = {
      request,
      resolve,
      reject,
      createdAt: Date.now(),
    };

    pendingApprovals.set(request.id, pending);

    // Timeout automatique
    setTimeout(() => {
      if (pendingApprovals.has(request.id)) {
        pendingApprovals.delete(request.id);
        resolve({
          decision: "reject",
          result: {
            success: false,
            stdout: "",
            stderr: "",
            exitCode: -1,
            error: "Timeout: approbation expirée",
          },
        });
      }
    }, APPROVAL_TIMEOUT_MS);
  });
}

/**
 * Résout une approbation en attente
 */
export function resolveApproval(
  id: string,
  result: PendingApprovalResult
): boolean {
  const pending = pendingApprovals.get(id);
  if (!pending) {
    return false;
  }

  pendingApprovals.delete(id);
  pending.resolve(result);
  return true;
}

/**
 * Vérifie si une approbation est en attente
 */
export function hasPendingApproval(id: string): boolean {
  return pendingApprovals.has(id);
}

/**
 * Récupère une approbation en attente
 */
export function getPendingApproval(
  id: string
): ShellApprovalRequest | undefined {
  return pendingApprovals.get(id)?.request;
}

/**
 * Nettoie les approbations expirées
 */
export function cleanupExpiredApprovals(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, pending] of pendingApprovals) {
    if (now - pending.createdAt > APPROVAL_TIMEOUT_MS) {
      pendingApprovals.delete(id);
      pending.resolve({
        decision: "reject",
        result: {
          success: false,
          stdout: "",
          stderr: "",
          exitCode: -1,
          error: "Timeout: approbation expirée",
        },
      });
      cleaned++;
    }
  }

  return cleaned;
}
