import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join } from "path";
import type {
  ShellPermission,
  ShellPermissionsDatabase,
  ShellPermissionCheck,
  ShellPermissionStatus,
} from "@core/types";
import { isDangerousCommand, matchesPattern } from "@core/types";

const defaultData: ShellPermissionsDatabase = {
  permissions: [],
};

const file = join(process.cwd(), "data", "shell-permissions.json");
const adapter = new JSONFile<ShellPermissionsDatabase>(file);
const db = new Low<ShellPermissionsDatabase>(adapter, defaultData);

export async function initShellPermissions(): Promise<void> {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

function generateId(): string {
  return `perm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Vérifie si une commande est autorisée pour un dossier donné
 */
export async function checkPermission(
  command: string,
  directory: string
): Promise<ShellPermissionCheck> {
  // 1. Vérifier si c'est une commande dangereuse
  if (isDangerousCommand(command)) {
    return {
      status: "blocked",
      command,
      directory,
      reason: `La commande contient des éléments dangereux bloqués pour raisons de sécurité`,
    };
  }

  // 2. Vérifier dans la whitelist
  await db.read();

  // Normaliser le directory (enlever le trailing slash)
  const normalizedDir = directory.replace(/\/+$/, "");

  for (const permission of db.data.permissions) {
    const permDir = permission.directory.replace(/\/+$/, "");

    // Le directory doit correspondre exactement ou être un sous-dossier
    if (
      normalizedDir === permDir ||
      normalizedDir.startsWith(permDir + "/")
    ) {
      if (matchesPattern(command, permission.pattern)) {
        return {
          status: "allowed",
          command,
          directory,
          matchedPattern: permission.pattern,
        };
      }
    }
  }

  // 3. Commande non dans la whitelist, nécessite approbation
  return {
    status: "needs_approval",
    command,
    directory,
    reason: "Cette commande n'est pas dans la liste des commandes autorisées pour ce dossier",
  };
}

/**
 * Ajoute une permission pour un pattern de commande dans un dossier
 */
export async function addPermission(
  pattern: string,
  directory: string,
  description?: string
): Promise<ShellPermission> {
  await db.read();

  // Vérifier si la permission existe déjà
  const normalizedDir = directory.replace(/\/+$/, "");
  const existing = db.data.permissions.find(
    (p) =>
      p.pattern === pattern &&
      p.directory.replace(/\/+$/, "") === normalizedDir
  );

  if (existing) {
    return existing;
  }

  const permission: ShellPermission = {
    id: generateId(),
    pattern,
    directory: normalizedDir,
    createdAt: Date.now(),
    description,
  };

  db.data.permissions.push(permission);
  await db.write();

  return permission;
}

/**
 * Supprime une permission par son ID
 */
export async function removePermission(id: string): Promise<boolean> {
  await db.read();

  const index = db.data.permissions.findIndex((p) => p.id === id);
  if (index === -1) return false;

  db.data.permissions.splice(index, 1);
  await db.write();

  return true;
}

/**
 * Récupère toutes les permissions
 */
export async function getAllPermissions(): Promise<ShellPermission[]> {
  await db.read();
  return db.data.permissions;
}

/**
 * Récupère les permissions pour un dossier spécifique
 */
export async function getPermissionsForDirectory(
  directory: string
): Promise<ShellPermission[]> {
  await db.read();

  const normalizedDir = directory.replace(/\/+$/, "");

  return db.data.permissions.filter((p) => {
    const permDir = p.directory.replace(/\/+$/, "");
    return normalizedDir === permDir || normalizedDir.startsWith(permDir + "/");
  });
}

/**
 * Supprime toutes les permissions pour un dossier
 */
export async function clearPermissionsForDirectory(
  directory: string
): Promise<number> {
  await db.read();

  const normalizedDir = directory.replace(/\/+$/, "");
  const initialCount = db.data.permissions.length;

  db.data.permissions = db.data.permissions.filter((p) => {
    const permDir = p.directory.replace(/\/+$/, "");
    return normalizedDir !== permDir && !normalizedDir.startsWith(permDir + "/");
  });

  await db.write();

  return initialCount - db.data.permissions.length;
}
