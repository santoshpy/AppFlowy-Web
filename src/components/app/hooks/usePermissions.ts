import { useEffect, useMemo, useState } from 'react';

import { RoleService } from '@/application/services/domains';
import { Role } from '@/application/types';
import { useCurrentWorkspaceId, useUserWorkspaceInfo } from '@/components/app/app.hooks';
import { useCurrentUser } from '@/components/main/app.hooks';

// Must mirror the backend capability catalog (af_permissions.capability).
export const ALL_CAPABILITIES = [
  'page.view',
  'page.comment',
  'page.edit',
  'page.delete',
  'object.manage',
  'member.manage',
  'group.manage',
  'role.manage',
] as const;

export type CapabilityKey = (typeof ALL_CAPABILITIES)[number];

// Capabilities a base workspace role confers (mirrors the backend default so the
// UI behaves correctly before the effective capabilities have loaded, or if the
// endpoint is unavailable).
function fallbackCapabilities(role: Role | undefined, isOwner: boolean): Set<string> {
  if (isOwner || role === Role.Owner) return new Set(ALL_CAPABILITIES);
  if (role === Role.Member) return new Set(['page.view', 'page.comment', 'page.edit']);
  if (role === Role.Guest) return new Set(['page.view']);
  return new Set();
}

/**
 * Resolves the current user's effective capabilities in the active workspace.
 *
 * Fetches the backend `my-capabilities` (base role + assigned custom roles) and
 * falls back to a role-derived set while loading or on failure, so consumers can
 * migrate to capability checks without depending on the endpoint being present.
 */
export function usePermissions() {
  const currentWorkspaceId = useCurrentWorkspaceId();
  const userWorkspaceInfo = useUserWorkspaceInfo();
  const currentUser = useCurrentUser();
  const [fetched, setFetched] = useState<Set<string> | null>(null);

  const workspace = useMemo(
    () => userWorkspaceInfo?.workspaces.find((w) => w.id === currentWorkspaceId),
    [userWorkspaceInfo?.workspaces, currentWorkspaceId]
  );
  const role = workspace?.role;
  const isOwner = workspace?.owner?.uid.toString() === currentUser?.uid.toString();

  useEffect(() => {
    if (!currentWorkspaceId) return;
    let cancelled = false;

    setFetched(null);
    void (async () => {
      try {
        const list = await RoleService.getMyCapabilities(currentWorkspaceId);

        if (!cancelled) setFetched(new Set(list));
      } catch {
        // Keep the role-based fallback if the endpoint is unavailable.
        if (!cancelled) setFetched(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceId]);

  const capabilities = fetched ?? fallbackCapabilities(role, isOwner);

  return { capabilities, role, isOwner };
}

/** Returns whether the current user holds the given capability in the workspace. */
export function useCan(capability: CapabilityKey): boolean {
  const { capabilities } = usePermissions();

  return capabilities.has(capability);
}
