/**
 * Types pour les shell tools et le système de permissions
 */

// Commandes dangereuses bloquées (ne peuvent jamais être exécutées)
export const DANGEROUS_COMMANDS = [
  "rm",
  "rmdir",
  "del",
  "format",
  "mkfs",
  "dd",
  "shred",
  "fdisk",
  "parted",
  "kill",
  "killall",
  "pkill",
  "shutdown",
  "reboot",
  "halt",
  "poweroff",
  "init",
  "systemctl",
  "chmod",
  "chown",
  "sudo",
  "su",
  "passwd",
  "useradd",
  "userdel",
  "groupadd",
  "groupdel",
  ">",    // Redirection écrasante
  ">>",   // Redirection append
  "|",    // Pipe (peut être dangereux en combinaison)
  "&&",   // Chaînage de commandes
  "||",   // Chaînage conditionnel
  ";",    // Séparateur de commandes
  "`",    // Command substitution
  "$(",   // Command substitution
  "eval",
  "exec",
  "source",
  ".",    // Source command
] as const;

// Permission d'une commande pour un dossier spécifique
export interface ShellPermission {
  id: string;
  pattern: string;           // Pattern de commande (ex: "ls", "cat *", "git status")
  directory: string;         // Chemin absolu du dossier autorisé
  createdAt: number;
  description?: string;      // Description optionnelle de ce que fait la commande
}

// Base de données des permissions
export interface ShellPermissionsDatabase {
  permissions: ShellPermission[];
}

// Requête d'exécution de commande shell
export interface ShellExecuteRequest {
  command: string;           // La commande à exécuter
  directory: string;         // Le dossier dans lequel exécuter
  approvalId?: string;       // ID d'approbation si déjà approuvé
}

// Résultat d'une exécution shell
export interface ShellExecuteResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

// Statut de permission d'une commande
export type ShellPermissionStatus =
  | "allowed"                // Commande autorisée (dans la whitelist)
  | "needs_approval"         // Commande nécessite approbation utilisateur
  | "blocked";               // Commande bloquée (dangereuse)

// Résultat de vérification de permission
export interface ShellPermissionCheck {
  status: ShellPermissionStatus;
  command: string;
  directory: string;
  reason?: string;           // Explication (ex: "Commande rm bloquée pour raisons de sécurité")
  matchedPattern?: string;   // Pattern qui a matché (si allowed)
}

// Requête d'approbation
export interface ShellApprovalRequest {
  id: string;                // ID unique pour cette demande
  command: string;
  directory: string;
  timestamp: number;
}

// Réponse d'approbation de l'utilisateur
export interface ShellApprovalResponse {
  id: string;                // ID de la demande
  decision: "approve" | "always_approve" | "reject";
}

// Statut d'une commande shell résolue (pour affichage dans le chat)
export type ShellCommandStatus =
  | "approved"         // Commande approuvée manuellement
  | "rejected"         // Commande refusée
  | "auto_approved"    // Commande auto-approuvée (whitelist)
  | "always_approved"; // Commande approuvée + ajoutée à la whitelist

// Commande shell résolue (pour affichage historique dans le chat)
export interface ResolvedShellCommand {
  id: string;
  command: string;
  directory: string;
  status: ShellCommandStatus;
  timestamp: number;
  result?: ShellExecuteResult;  // Résultat si la commande a été exécutée
}

// Événement SSE pour les shell tools
export interface ShellApprovalSSEEvent {
  type: "shell_approval_required";
  approvalRequest: ShellApprovalRequest;
}

// Événement SSE pour le résultat shell
export interface ShellResultSSEEvent {
  type: "shell_result";
  result: ShellExecuteResult;
  command: string;
  directory: string;
}

// Type utilitaire pour vérifier si une commande est dangereuse
export function isDangerousCommand(command: string): boolean {
  const trimmedCommand = command.trim().toLowerCase();
  const firstWord = trimmedCommand.split(/\s+/)[0];

  // Vérifier si la commande commence par une commande dangereuse
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (firstWord === dangerous || trimmedCommand.startsWith(dangerous + " ")) {
      return true;
    }
    // Vérifier aussi si la commande contient des opérateurs dangereux
    if ([">", ">>", "|", "&&", "||", ";", "`", "$("].includes(dangerous)) {
      if (trimmedCommand.includes(dangerous)) {
        return true;
      }
    }
  }

  return false;
}

// Vérifier si un pattern matche une commande
export function matchesPattern(command: string, pattern: string): boolean {
  // Pattern simple: convertir * en regex
  const regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")  // Escape special chars
    .replace(/\\\*/g, ".*");                   // Convert * to .*

  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(command.trim());
}
