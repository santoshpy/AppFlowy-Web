import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { GroupService } from '@/application/services/domains';
import { Group, GroupMember } from '@/application/types';
import { ReactComponent as MoreIcon } from '@/assets/icons/more.svg';
import { useCurrentWorkspaceId, useUserWorkspaceInfo } from '@/components/app/app.hooks';
import { useCurrentUser } from '@/components/main/app.hooks';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

export function GroupsPanel() {
  const currentWorkspaceId = useCurrentWorkspaceId();
  const userWorkspaceInfo = useUserWorkspaceInfo();
  const currentUser = useCurrentUser();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const isOwner = useMemo(() => {
    const workspace = userWorkspaceInfo?.workspaces.find((w) => w.id === currentWorkspaceId);

    return workspace?.owner?.uid.toString() === currentUser?.uid.toString();
  }, [userWorkspaceInfo?.workspaces, currentWorkspaceId, currentUser?.uid]);

  const refreshGroups = useCallback(async () => {
    if (!currentWorkspaceId) return;
    try {
      const list = await GroupService.getGroups(currentWorkspaceId);

      setGroups(list);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    let cancelled = false;

    setLoadingGroups(true);
    void (async () => {
      try {
        const list = await GroupService.getGroups(currentWorkspaceId);

        if (!cancelled) setGroups(list);
      } catch (e) {
        if (!cancelled) toast.error(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceId]);

  const refreshMembers = useCallback(
    async (groupId: string) => {
      if (!currentWorkspaceId) return;
      try {
        const list = await GroupService.getGroupMembers(currentWorkspaceId, groupId);

        setMembers(list);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
    [currentWorkspaceId]
  );

  useEffect(() => {
    if (!currentWorkspaceId || !selectedGroup) {
      setMembers([]);
      return;
    }

    let cancelled = false;

    setLoadingMembers(true);
    void (async () => {
      try {
        const list = await GroupService.getGroupMembers(currentWorkspaceId, selectedGroup.id);

        if (!cancelled) setMembers(list);
      } catch (e) {
        if (!cancelled) toast.error(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceId, selectedGroup]);

  const handleCreate = useCallback(async () => {
    const name = newName.trim();

    if (!currentWorkspaceId || !name) return;
    setCreating(true);
    try {
      await GroupService.createGroup(currentWorkspaceId, { name });
      toast.success('Group created');
      setNewName('');
      await refreshGroups();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }, [currentWorkspaceId, newName, refreshGroups]);

  const handleDelete = useCallback(
    async (group: Group) => {
      if (!currentWorkspaceId) return;
      try {
        await GroupService.deleteGroup(currentWorkspaceId, group.id);
        toast.success('Group deleted');
        if (selectedGroup?.id === group.id) setSelectedGroup(null);
        await refreshGroups();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
    [currentWorkspaceId, refreshGroups, selectedGroup?.id]
  );

  const handleAddMember = useCallback(async () => {
    const email = memberEmail.trim();

    if (!currentWorkspaceId || !selectedGroup || !email) return;
    setAddingMember(true);
    try {
      await GroupService.addGroupMember(currentWorkspaceId, selectedGroup.id, email);
      toast.success('Member added');
      setMemberEmail('');
      await refreshMembers(selectedGroup.id);
      await refreshGroups();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setAddingMember(false);
    }
  }, [currentWorkspaceId, memberEmail, refreshGroups, refreshMembers, selectedGroup]);

  const handleRemoveMember = useCallback(
    async (uid: number) => {
      if (!currentWorkspaceId || !selectedGroup) return;
      try {
        await GroupService.removeGroupMember(currentWorkspaceId, selectedGroup.id, uid);
        toast.success('Member removed');
        await refreshMembers(selectedGroup.id);
        await refreshGroups();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
    [currentWorkspaceId, refreshGroups, refreshMembers, selectedGroup]
  );

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden'>
      <div className='border-b border-border-primary px-8 py-5'>
        <h2 className='text-xl font-semibold text-text-primary'>Groups</h2>
      </div>
      <div className='appflowy-scroller flex-1 overflow-y-auto px-8 py-6'>
        <div className='flex flex-col gap-6'>
          {isOwner && (
            <div className='flex flex-col gap-2'>
              <div className='text-sm font-semibold text-text-primary'>Create a group</div>
              <div className='flex gap-2'>
                <Input
                  className='flex-1'
                  value={newName}
                  placeholder='Group name (e.g. Engineering)'
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creating && newName.trim()) {
                      void handleCreate();
                    }
                  }}
                  data-testid='group-name-input'
                />
                <Button
                  onClick={() => void handleCreate()}
                  disabled={!newName.trim() || creating}
                  loading={creating}
                  data-testid='group-create-button'
                >
                  {creating && <Progress />}
                  Create
                </Button>
              </div>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <div className='text-sm font-semibold text-text-primary'>Workspace groups</div>
            {loadingGroups && groups.length === 0 ? (
              <div className='py-4 text-center text-sm text-text-secondary'>
                <Progress />
              </div>
            ) : groups.length === 0 ? (
              <div className='py-4 text-center text-sm text-text-secondary'>No groups yet</div>
            ) : (
              groups.map((g) => (
                <div
                  key={g.id}
                  data-testid={`group-row-${g.id}`}
                  className={`flex items-center gap-3 rounded-300 px-3 py-2 text-sm hover:bg-fill-content-hover ${
                    selectedGroup?.id === g.id ? 'bg-fill-content-hover' : ''
                  }`}
                >
                  <button
                    type='button'
                    className='flex min-w-0 flex-1 items-center gap-3 text-left'
                    onClick={() => setSelectedGroup(g)}
                    data-testid={`group-select-${g.id}`}
                  >
                    <Avatar size='md'>
                      <AvatarFallback name={g.name}>{g.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className='flex min-w-0 flex-col'>
                      <span className='truncate font-medium text-text-primary'>{g.name}</span>
                      <span className='truncate text-xs text-text-secondary'>
                        {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </button>
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type='button'
                          data-testid={`group-actions-${g.id}`}
                          className='flex h-6 w-6 items-center justify-center rounded-200 text-icon-secondary hover:bg-fill-content-hover'
                          aria-label='Group actions'
                        >
                          <MoreIcon className='h-4 w-4' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          variant='destructive'
                          data-testid={`group-delete-${g.id}`}
                          onSelect={() => void handleDelete(g)}
                        >
                          Delete group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))
            )}
          </div>

          {selectedGroup && (
            <div className='flex flex-col gap-3 border-t border-border-primary pt-6'>
              <div className='text-sm font-semibold text-text-primary'>
                Members of {selectedGroup.name}
              </div>
              {isOwner && (
                <div className='flex gap-2'>
                  <Input
                    className='flex-1'
                    value={memberEmail}
                    placeholder='Add a workspace member by email'
                    onChange={(e) => setMemberEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !addingMember && memberEmail.trim()) {
                        void handleAddMember();
                      }
                    }}
                    data-testid='group-member-email-input'
                  />
                  <Button
                    onClick={() => void handleAddMember()}
                    disabled={!memberEmail.trim() || addingMember}
                    loading={addingMember}
                    data-testid='group-member-add-button'
                  >
                    {addingMember && <Progress />}
                    Add
                  </Button>
                </div>
              )}
              {loadingMembers && members.length === 0 ? (
                <div className='py-4 text-center text-sm text-text-secondary'>
                  <Progress />
                </div>
              ) : members.length === 0 ? (
                <div className='py-4 text-center text-sm text-text-secondary'>
                  This group has no members yet
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.uid}
                    data-testid={`group-member-row-${m.uid}`}
                    className='flex items-center gap-3 py-2 text-sm'
                  >
                    <Avatar size='md'>
                      <AvatarFallback name={m.name}>
                        {(m.name || m.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate font-medium text-text-primary'>{m.name || m.email}</span>
                      <span className='truncate text-xs text-text-secondary'>{m.email}</span>
                    </div>
                    {isOwner ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type='button'
                            data-testid={`group-member-actions-${m.uid}`}
                            className='flex h-6 w-6 items-center justify-center rounded-200 text-icon-secondary hover:bg-fill-content-hover'
                            aria-label='Member actions'
                          >
                            <MoreIcon className='h-4 w-4' />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            variant='destructive'
                            data-testid={`group-member-remove-${m.uid}`}
                            onSelect={() => void handleRemoveMember(m.uid)}
                          >
                            Remove from group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className='w-6' aria-hidden='true' />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupsPanel;
