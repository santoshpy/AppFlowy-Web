import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AccessService } from '@/application/services/domains';
import { AccessLevel, GrantObjectType, ObjectGrant } from '@/application/types';
import { ReactComponent as MoreIcon } from '@/assets/icons/more.svg';
import { useCurrentWorkspaceId } from '@/components/app/app.hooks';
import { useCan } from '@/components/app/hooks/usePermissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const ACCESS_LEVEL_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: AccessLevel.ReadOnly, label: 'Can view' },
  { value: AccessLevel.ReadAndComment, label: 'Can comment' },
  { value: AccessLevel.ReadAndWrite, label: 'Can edit' },
  { value: AccessLevel.FullAccess, label: 'Full access' },
];

function accessLevelLabel(level: AccessLevel): string {
  return ACCESS_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? 'Can view';
}

export interface ObjectAccessManagerProps {
  /** The object (page/space/workspace) to manage access for. */
  objectId: string;
  objectType: GrantObjectType;
  /** Optional display name shown in the header. */
  objectName?: string;
}

/**
 * Manages object-level access grants (Django-style RBAC, Phase 1): list, grant a
 * user a specific access level by email, and revoke. Backed by the
 * /api/object-grant endpoints. Granting/revoking is owner-gated, mirroring the
 * backend which requires workspace Owner in Phase 1.
 */
export function ObjectAccessManager({ objectId, objectType, objectName }: ObjectAccessManagerProps) {
  const currentWorkspaceId = useCurrentWorkspaceId();
  const canManage = useCan('object.manage');

  const [grants, setGrants] = useState<ObjectGrant[]>([]);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<AccessLevel>(AccessLevel.ReadOnly);
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revokingUid, setRevokingUid] = useState<number | null>(null);
  // Bumped after a mutation to re-run the single cancellable fetch below, instead
  // of an unguarded imperative refresh (which could stale-write after unmount).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!currentWorkspaceId || !objectId) return;
    let cancelled = false;

    setLoading(true);
    void (async () => {
      try {
        const list = await AccessService.getObjectGrants(currentWorkspaceId, objectId);

        if (!cancelled) setGrants(list);
      } catch (e) {
        if (!cancelled) toast.error(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceId, objectId, reloadKey]);

  const handleGrant = useCallback(async () => {
    const trimmed = email.trim();

    if (!currentWorkspaceId || !trimmed) return;
    setGranting(true);
    try {
      await AccessService.grantObjectAccess(currentWorkspaceId, {
        objectType,
        objectId,
        email: trimmed,
        accessLevel: level,
      });
      toast.success('Access granted');
      setEmail('');
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setGranting(false);
    }
  }, [currentWorkspaceId, email, level, objectId, objectType]);

  const handleRevoke = useCallback(
    async (uid: number) => {
      if (!currentWorkspaceId || !objectId) return;
      setRevokingUid(uid);
      try {
        await AccessService.revokeObjectGrant(currentWorkspaceId, objectId, uid);
        toast.success('Access revoked');
        setReloadKey((k) => k + 1);
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        setRevokingUid(null);
      }
    },
    [currentWorkspaceId, objectId]
  );

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-semibold text-text-primary'>People with access</h3>
        {objectName && <span className='text-xs text-text-secondary'>{objectName}</span>}
      </div>

      {canManage && (
        <div className='flex gap-2'>
          <Input
            className='flex-1'
            value={email}
            placeholder='Add people by email'
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !granting && email.trim()) {
                void handleGrant();
              }
            }}
            data-testid='object-grant-email-input'
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' data-testid='object-grant-level-trigger'>
                {accessLevelLabel(level)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {ACCESS_LEVEL_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.value} onSelect={() => setLevel(opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => void handleGrant()}
            disabled={!email.trim() || granting}
            loading={granting}
            data-testid='object-grant-add-button'
          >
            {granting && <Progress />}
            Grant
          </Button>
        </div>
      )}

      <div className='flex flex-col gap-1'>
        {loading && grants.length === 0 ? (
          <div className='py-4 text-center text-sm text-text-secondary'>
            <Progress />
          </div>
        ) : grants.length === 0 ? (
          <div className='py-4 text-center text-sm text-text-secondary'>No one has been granted access yet</div>
        ) : (
          grants.map((g) => (
            <div
              key={g.uid}
              data-testid={`object-grant-row-${g.uid}`}
              className='flex items-center gap-3 py-2 text-sm'
            >
              <Avatar size='md'>
                <AvatarImage src={undefined} alt={g.name} />
                <AvatarFallback name={g.name}>{(g.name || g.email).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate font-medium text-text-primary'>{g.name || g.email}</span>
                <span className='truncate text-xs text-text-secondary'>{g.email}</span>
              </div>
              <span className='text-text-secondary'>{accessLevelLabel(g.access_level)}</span>
              {canManage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type='button'
                      data-testid={`object-grant-actions-${g.uid}`}
                      disabled={revokingUid === g.uid}
                      className='flex h-6 w-6 items-center justify-center rounded-200 text-icon-secondary hover:bg-fill-content-hover disabled:opacity-50'
                      aria-label='Grant actions'
                    >
                      <MoreIcon className='h-4 w-4' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      variant='destructive'
                      data-testid={`object-grant-revoke-${g.uid}`}
                      onSelect={() => void handleRevoke(g.uid)}
                    >
                      Remove access
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
    </div>
  );
}

export default ObjectAccessManager;
