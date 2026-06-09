import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { RoleService } from '@/application/services/domains';
import { Capability, CustomRole } from '@/application/types';
import { ReactComponent as MoreIcon } from '@/assets/icons/more.svg';
import { useCurrentWorkspaceId } from '@/components/app/app.hooks';
import { useCan } from '@/components/app/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getErrorMessage } from '@/utils/errors';

interface RoleDraft {
  id?: number;
  name: string;
  description: string;
  caps: Set<string>;
}

export function RolesPanel() {
  const currentWorkspaceId = useCurrentWorkspaceId();
  const canManage = useCan('role.manage');

  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<RoleDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const refreshRoles = useCallback(async () => {
    if (!currentWorkspaceId) return;
    try {
      setRoles(await RoleService.getRoles(currentWorkspaceId));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    let cancelled = false;

    setLoading(true);
    void (async () => {
      try {
        const [caps, list] = await Promise.all([
          RoleService.getCapabilities(currentWorkspaceId),
          RoleService.getRoles(currentWorkspaceId),
        ]);

        if (cancelled) return;
        setCapabilities(caps);
        setRoles(list);
      } catch (e) {
        if (!cancelled) toast.error(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceId]);

  const startCreate = useCallback(() => {
    setDraft({ name: '', description: '', caps: new Set() });
  }, []);

  const startEdit = useCallback((role: CustomRole) => {
    setDraft({
      id: role.id,
      name: role.name,
      description: role.description ?? '',
      caps: new Set(role.capabilities),
    });
  }, []);

  const toggleCap = useCallback((cap: string) => {
    setDraft((d) => {
      if (!d) return d;
      const caps = new Set(d.caps);

      if (caps.has(cap)) caps.delete(cap);
      else caps.add(cap);
      return { ...d, caps };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentWorkspaceId || !draft) return;
    const name = draft.name.trim();

    if (!name) return;
    setSaving(true);
    try {
      const payload = { name, description: draft.description.trim(), capabilities: Array.from(draft.caps) };

      if (draft.id !== undefined) {
        await RoleService.updateRole(currentWorkspaceId, draft.id, payload);
        toast.success('Role updated');
      } else {
        await RoleService.createRole(currentWorkspaceId, payload);
        toast.success('Role created');
      }

      setDraft(null);
      await refreshRoles();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [currentWorkspaceId, draft, refreshRoles]);

  const handleDelete = useCallback(
    async (role: CustomRole) => {
      if (!currentWorkspaceId) return;
      try {
        await RoleService.deleteRole(currentWorkspaceId, role.id);
        toast.success('Role deleted');
        await refreshRoles();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
    [currentWorkspaceId, refreshRoles]
  );

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden'>
      <div className='flex items-center justify-between border-b border-border-primary px-8 py-5'>
        <h2 className='text-xl font-semibold text-text-primary'>Roles</h2>
        {canManage && !draft && (
          <Button onClick={startCreate} data-testid='role-new-button'>
            New role
          </Button>
        )}
      </div>
      <div className='appflowy-scroller flex-1 overflow-y-auto px-8 py-6'>
        {draft ? (
          <div className='flex flex-col gap-4'>
            <div className='text-sm font-semibold text-text-primary'>
              {draft.id !== undefined ? 'Edit role' : 'New role'}
            </div>
            <Input
              value={draft.name}
              placeholder='Role name (e.g. Reviewer)'
              onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
              data-testid='role-name-input'
            />
            <Input
              value={draft.description}
              placeholder='Description (optional)'
              onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
              data-testid='role-description-input'
            />
            <div className='flex flex-col gap-2'>
              <div className='text-sm font-medium text-text-primary'>Capabilities</div>
              <div className='flex flex-col gap-1 rounded-300 border border-border-primary p-3'>
                {capabilities.map((c) => (
                  <label
                    key={c.capability}
                    className='flex cursor-pointer items-start gap-3 rounded-200 px-2 py-1.5 hover:bg-fill-content-hover'
                    data-testid={`role-cap-${c.capability}`}
                  >
                    <input
                      type='checkbox'
                      className='mt-0.5 h-4 w-4 accent-fill-default'
                      checked={draft.caps.has(c.capability)}
                      onChange={() => toggleCap(c.capability)}
                    />
                    <div className='flex flex-col'>
                      <span className='text-sm text-text-primary'>{c.name}</span>
                      {c.description && (
                        <span className='text-xs text-text-secondary'>{c.description}</span>
                      )}
                      <span className='text-[11px] text-text-tertiary'>{c.capability}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={() => void handleSave()}
                disabled={!draft.name.trim() || saving}
                loading={saving}
                data-testid='role-save-button'
              >
                {saving && <Progress />}
                Save
              </Button>
              <Button variant='outline' onClick={() => setDraft(null)} data-testid='role-cancel-button'>
                Cancel
              </Button>
            </div>
          </div>
        ) : loading && roles.length === 0 ? (
          <div className='py-6 text-center text-sm text-text-secondary'>
            <Progress />
          </div>
        ) : roles.length === 0 ? (
          <div className='py-6 text-center text-sm text-text-secondary'>
            No custom roles yet. Create one to delegate specific capabilities to members.
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {roles.map((r) => (
              <div
                key={r.id}
                data-testid={`role-row-${r.id}`}
                className='flex items-center gap-3 rounded-300 px-3 py-2 text-sm hover:bg-fill-content-hover'
              >
                <button
                  type='button'
                  className='flex min-w-0 flex-1 flex-col text-left'
                  onClick={() => canManage && startEdit(r)}
                  data-testid={`role-edit-${r.id}`}
                >
                  <span className='truncate font-medium text-text-primary'>{r.name}</span>
                  <span className='truncate text-xs text-text-secondary'>
                    {r.capabilities.length} {r.capabilities.length === 1 ? 'capability' : 'capabilities'}
                    {r.description ? ` · ${r.description}` : ''}
                  </span>
                </button>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type='button'
                        data-testid={`role-actions-${r.id}`}
                        className='flex h-6 w-6 items-center justify-center rounded-200 text-icon-secondary hover:bg-fill-content-hover'
                        aria-label='Role actions'
                      >
                        <MoreIcon className='h-4 w-4' />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onSelect={() => startEdit(r)} data-testid={`role-edit-menu-${r.id}`}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant='destructive'
                        onSelect={() => void handleDelete(r)}
                        data-testid={`role-delete-${r.id}`}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RolesPanel;
