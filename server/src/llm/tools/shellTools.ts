import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { spawn } from "child_process";
import { existsSync, statSync } from "fs";
import type {
  ShellExecuteResult,
  ShellPermissionCheck,
  ShellApprovalRequest,
} from "@core/types";
import {
  checkPermission,
  addPermission,
} from "../../services/shellPermissions";

// Constantes pour identifier les types de résultats shell
export const NEEDS_APPROVAL_PREFIX = "__SHELL_NEEDS_APPROVAL__";
export const BLOCKED_PREFIX = "__SHELL_BLOCKED__";
export const AUTO_APPROVED_PREFIX = "__SHELL_AUTO_APPROVED__";

/**
 * Exécute une commande shell dans un dossier donné
 */
async function executeShellCommand(
  command: string,
  directory: string
): Promise<ShellExecuteResult> {
  return new Promise((resolve) => {
    try {
      // Vérifier que le dossier existe
      if (!existsSync(directory)) {
        resolve({
          success: false,
          error: `Le dossier "${directory}" n'existe pas`,
        });
        return;
      }

      const stat = statSync(directory);
      if (!stat.isDirectory()) {
        resolve({
          success: false,
          error: `"${directory}" n'est pas un dossier`,
        });
        return;
      }

      // Exécuter la commande avec un timeout
      const proc = spawn("sh", ["-c", command], {
        cwd: directory,
        timeout: 30000, // 30 secondes max
        env: { ...process.env },
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? undefined,
        });
      });

      proc.on("error", (err) => {
        resolve({
          success: false,
          error: err.message,
        });
      });
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  });
}

/**
 * Génère un ID unique pour une demande d'approbation
 */
function generateApprovalId(): string {
  return `approval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Map pour stocker les demandes d'approbation en attente
// Key: approvalId, Value: { command, directory, resolve }
export const pendingApprovals = new Map<
  string,
  {
    command: string;
    directory: string;
    resolve: (result: ShellExecuteResult) => void;
  }
>();

/**
 * Tool shell générique pour LangChain
 */
export const ExecuteShellCommand = tool(
  async ({ command, directory }) => {
    // Vérifier les permissions
    const permissionCheck = await checkPermission(command, directory);

    if (permissionCheck.status === "blocked") {
      return `${BLOCKED_PREFIX}${JSON.stringify({
        status: "blocked",
        reason: permissionCheck.reason,
        command,
        directory,
      })}`;
    }

    if (permissionCheck.status === "needs_approval") {
      // Créer une demande d'approbation
      const approvalRequest: ShellApprovalRequest = {
        id: generateApprovalId(),
        command,
        directory,
        timestamp: Date.now(),
      };

      return `${NEEDS_APPROVAL_PREFIX}${JSON.stringify(approvalRequest)}`;
    }

    // Commande autorisée (whitelistée), exécuter et signaler comme auto-approuvée
    const result = await executeShellCommand(command, directory);

    // Retourner avec le préfixe AUTO_APPROVED pour que le serveur puisse envoyer l'événement SSE
    return `${AUTO_APPROVED_PREFIX}${JSON.stringify({
      command,
      directory,
      result,
    })}`;
  },
  {
    name: "execute_shell_command",
    description: "Execute a shell command in a specified directory. Use for ls, cat, grep, git, npm commands.",
    schema: z.object({
      command: z.string().describe("The shell command to execute, e.g. 'ls -la' or 'git status'"),
      directory: z.string().describe("The absolute path to the directory where the command will run"),
    }),
  }
);

/**
 * Approuve et exécute une commande en attente
 */
export async function approveAndExecute(
  approvalId: string,
  alwaysApprove: boolean = false
): Promise<ShellExecuteResult & { command: string; directory: string }> {
  // Parser l'approvalId pour récupérer command et directory
  // Note: Dans une implémentation réelle, on devrait stocker ces infos côté serveur
  // Pour l'instant, on les passe via l'API

  return {
    success: false,
    error: "Cette fonction doit être appelée avec les paramètres command et directory",
    command: "",
    directory: "",
  };
}

/**
 * Exécute une commande après approbation manuelle
 */
export async function executeApprovedCommand(
  command: string,
  directory: string,
  addToWhitelist: boolean = false
): Promise<ShellExecuteResult & { command: string; directory: string }> {
  // Si demandé, ajouter à la whitelist
  if (addToWhitelist) {
    // Extraire le pattern de base de la commande (premier mot)
    const baseCommand = command.split(/\s+/)[0];
    await addPermission(baseCommand + " *", directory, `Auto-ajouté le ${new Date().toLocaleString()}`);
  }

  const result = await executeShellCommand(command, directory);

  return {
    ...result,
    command,
    directory,
  };
}

/**
 * Helper pour vérifier si un résultat de tool nécessite une approbation
 */
export function needsApproval(toolResult: string): ShellApprovalRequest | null {
  if (toolResult.startsWith(NEEDS_APPROVAL_PREFIX)) {
    try {
      return JSON.parse(toolResult.slice(NEEDS_APPROVAL_PREFIX.length));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Helper pour vérifier si une commande est bloquée
 */
export function isBlocked(toolResult: string): { reason: string; command: string; directory: string } | null {
  if (toolResult.startsWith(BLOCKED_PREFIX)) {
    try {
      return JSON.parse(toolResult.slice(BLOCKED_PREFIX.length));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Helper pour vérifier si une commande a été auto-approuvée (whitelistée)
 */
export function isAutoApproved(toolResult: string): { command: string; directory: string; result: ShellExecuteResult } | null {
  if (toolResult.startsWith(AUTO_APPROVED_PREFIX)) {
    try {
      return JSON.parse(toolResult.slice(AUTO_APPROVED_PREFIX.length));
    } catch {
      return null;
    }
  }
  return null;
}
