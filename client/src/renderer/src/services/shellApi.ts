import type {
  ShellExecuteResult,
  ShellPermission,
  ShellPermissionCheck,
  ShellApprovalResponse,
} from "@core/types";

const BASE_URL = "http://localhost:8080";

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}

/**
 * Service pour les commandes shell
 */
export class ShellApiService {
  private baseUrl: string;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Vérifie si une commande est autorisée pour un dossier
   */
  async checkPermission(
    command: string,
    directory: string
  ): Promise<ShellPermissionCheck> {
    const params = new URLSearchParams({ command, directory });
    const response = await fetch(
      `${this.baseUrl}/shell/check?${params.toString()}`
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erreur lors de la vérification");
    }

    return {
      status: data.status,
      command: data.command,
      directory: data.directory,
      reason: data.reason,
      matchedPattern: data.matchedPattern,
    };
  }

  /**
   * Exécute une commande approuvée
   */
  async executeCommand(
    command: string,
    directory: string,
    addToWhitelist = false
  ): Promise<ShellExecuteResult & { command: string; directory: string }> {
    const response = await fetch(`${this.baseUrl}/shell/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, directory, addToWhitelist }),
    });
    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Erreur lors de l'exécution",
        command,
        directory,
      };
    }

    return data.result;
  }

  /**
   * Approuve une commande et l'exécute
   */
  async approveCommand(
    approvalResponse: ShellApprovalResponse & { command: string; directory: string }
  ): Promise<{
    executed: boolean;
    result?: ShellExecuteResult & { command: string; directory: string };
    addedToWhitelist?: boolean;
    message?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/shell/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(approvalResponse),
    });
    const data = await response.json();

    if (!data.success && data.status !== "blocked") {
      throw new Error(data.error || "Erreur lors de l'approbation");
    }

    return {
      executed: data.executed || false,
      result: data.result,
      addedToWhitelist: data.addedToWhitelist,
      message: data.message,
    };
  }

  /**
   * Récupère toutes les permissions
   */
  async getPermissions(directory?: string): Promise<ShellPermission[]> {
    const url = directory
      ? `${this.baseUrl}/shell/permissions?directory=${encodeURIComponent(directory)}`
      : `${this.baseUrl}/shell/permissions`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erreur lors de la récupération");
    }

    return data.permissions;
  }

  /**
   * Ajoute une permission
   */
  async addPermission(
    pattern: string,
    directory: string,
    description?: string
  ): Promise<ShellPermission> {
    const response = await fetch(`${this.baseUrl}/shell/permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern, directory, description }),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erreur lors de l'ajout");
    }

    return data.permission;
  }

  /**
   * Supprime une permission
   */
  async deletePermission(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/shell/permissions/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erreur lors de la suppression");
    }
  }

  /**
   * Supprime toutes les permissions d'un dossier
   */
  async clearDirectoryPermissions(directory: string): Promise<number> {
    const response = await fetch(
      `${this.baseUrl}/shell/permissions/directory`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory }),
      }
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erreur lors de la suppression");
    }

    return data.count;
  }
}

// Instance singleton
export const shellApi = new ShellApiService();
