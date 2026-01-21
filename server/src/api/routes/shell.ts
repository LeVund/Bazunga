import { Context } from "hono";
import {
  checkPermission,
  addPermission,
  removePermission,
  getAllPermissions,
  getPermissionsForDirectory,
  clearPermissionsForDirectory,
} from "../../services/shellPermissions";
import { executeApprovedCommand } from "../../llm/tools/shellTools";
import {
  resolveApproval,
  hasPendingApproval,
} from "../../services/pendingApprovals";
import type { ShellApprovalResponse } from "@core/types";

/**
 * Vérifie si une commande est autorisée pour un dossier
 * GET /shell/check?command=xxx&directory=xxx
 */
export async function handleCheckPermission(c: Context): Promise<Response> {
  try {
    const command = c.req.query("command");
    const directory = c.req.query("directory");

    if (!command || !directory) {
      return c.json(
        { success: false, error: "command et directory sont requis" },
        400
      );
    }

    const result = await checkPermission(command, directory);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      500
    );
  }
}

/**
 * Exécute une commande approuvée
 * POST /shell/execute
 * Body: { command, directory, addToWhitelist? }
 */
export async function handleExecuteCommand(c: Context): Promise<Response> {
  try {
    const body = await c.req.json<{
      command: string;
      directory: string;
      addToWhitelist?: boolean;
    }>();

    const { command, directory, addToWhitelist = false } = body;

    if (!command || !directory) {
      return c.json(
        { success: false, error: "command et directory sont requis" },
        400
      );
    }

    // Vérifier d'abord les permissions
    const permCheck = await checkPermission(command, directory);

    if (permCheck.status === "blocked") {
      return c.json(
        {
          success: false,
          error: permCheck.reason || "Commande bloquée",
          status: "blocked",
        },
        403
      );
    }

    // Exécuter la commande
    const result = await executeApprovedCommand(command, directory, addToWhitelist);

    return c.json({
      success: result.success,
      result,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      500
    );
  }
}

/**
 * Approuve une commande (et optionnellement l'ajoute à la whitelist)
 * POST /shell/approve
 * Body: ShellApprovalResponse
 */
export async function handleApproveCommand(c: Context): Promise<Response> {
  try {
    const body = await c.req.json<
      ShellApprovalResponse & { command: string; directory: string }
    >();

    const { id, decision, command, directory } = body;

    if (!id || !decision || !command || !directory) {
      return c.json(
        {
          success: false,
          error: "id, decision, command et directory sont requis",
        },
        400
      );
    }

    // Vérifier si c'est une approbation en attente (stream en pause)
    const isPending = hasPendingApproval(id);

    if (decision === "reject") {
      // Résoudre l'approbation en attente si elle existe
      if (isPending) {
        resolveApproval(id, { decision: "reject" });
      }
      return c.json({
        success: true,
        executed: false,
        message: "Commande rejetée par l'utilisateur",
      });
    }

    // Vérifier les permissions
    const permCheck = await checkPermission(command, directory);
    if (permCheck.status === "blocked") {
      // Résoudre l'approbation comme rejetée si bloquée
      if (isPending) {
        resolveApproval(id, {
          decision: "reject",
          result: {
            success: false,
            stdout: "",
            stderr: "",
            exitCode: -1,
            error: permCheck.reason || "Commande bloquée",
          },
        });
      }
      return c.json(
        {
          success: false,
          error: permCheck.reason || "Commande bloquée",
          status: "blocked",
        },
        403
      );
    }

    // Exécuter avec ajout à la whitelist si "always_approve"
    const addToWhitelist = decision === "always_approve";
    const result = await executeApprovedCommand(command, directory, addToWhitelist);

    // Résoudre l'approbation en attente si elle existe
    if (isPending) {
      resolveApproval(id, { decision, result });
    }

    return c.json({
      success: result.success,
      executed: true,
      result,
      addedToWhitelist: addToWhitelist,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      500
    );
  }
}

/**
 * Récupère toutes les permissions
 * GET /shell/permissions
 */
export async function handleGetPermissions(c: Context): Promise<Response> {
  try {
    const directory = c.req.query("directory");

    const permissions = directory
      ? await getPermissionsForDirectory(directory)
      : await getAllPermissions();

    return c.json({ success: true, permissions });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      500
    );
  }
}

/**
 * Ajoute une permission
 * POST /shell/permissions
 * Body: { pattern, directory, description? }
 */
export async function handleAddPermission(c: Context): Promise<Response> {
  try {
    const body = await c.req.json<{
      pattern: string;
      directory: string;
      description?: string;
    }>();

    const { pattern, directory, description } = body;

    if (!pattern || !directory) {
      return c.json(
        { success: false, error: "pattern et directory sont requis" },
        400
      );
    }

    const permission = await addPermission(pattern, directory, description);
    return c.json({ success: true, permission });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      500
    );
  }
}

/**
 * Supprime une permission
 * DELETE /shell/permissions/:id
 */
export async function handleDeletePermission(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ success: false, error: "id est requis" }, 400);
    }

    const deleted = await removePermission(id);

    if (!deleted) {
      return c.json({ success: false, error: "Permission non trouvée" }, 404);
    }

    return c.json({ success: true, message: "Permission supprimée" });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      500
    );
  }
}

/**
 * Supprime toutes les permissions d'un dossier
 * DELETE /shell/permissions/directory
 * Body: { directory }
 */
export async function handleClearDirectoryPermissions(
  c: Context
): Promise<Response> {
  try {
    const body = await c.req.json<{ directory: string }>();
    const { directory } = body;

    if (!directory) {
      return c.json({ success: false, error: "directory est requis" }, 400);
    }

    const count = await clearPermissionsForDirectory(directory);

    return c.json({
      success: true,
      message: `${count} permission(s) supprimée(s)`,
      count,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      500
    );
  }
}
