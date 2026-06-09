import { AccessLevel, GrantObjectType, Group, GroupMember } from '@/application/types';

import { APIResponse, executeAPIRequest, executeAPIVoidRequest, getAxios } from './core';

// Groups (Phase 2). Group management is owner-gated on the backend.

export async function getGroups(workspaceId: string): Promise<Group[]> {
  const url = `/api/group/workspace/${workspaceId}`;

  const data = await executeAPIRequest<{ groups: Group[] }>(() =>
    getAxios()?.get<APIResponse<{ groups: Group[] }>>(url)
  );

  return data.groups;
}

export async function createGroup(
  workspaceId: string,
  params: { name: string; description?: string }
): Promise<string> {
  const url = `/api/group/workspace/${workspaceId}`;

  return executeAPIRequest<string>(() =>
    getAxios()?.post<APIResponse<string>>(url, {
      name: params.name,
      description: params.description ?? null,
    })
  );
}

export async function deleteGroup(workspaceId: string, groupId: string) {
  const url = `/api/group/workspace/${workspaceId}/${groupId}`;

  return executeAPIVoidRequest(() =>
    getAxios()?.delete<APIResponse>(url)
  );
}

export async function getGroupMembers(workspaceId: string, groupId: string): Promise<GroupMember[]> {
  const url = `/api/group/workspace/${workspaceId}/${groupId}/member`;

  const data = await executeAPIRequest<{ members: GroupMember[] }>(() =>
    getAxios()?.get<APIResponse<{ members: GroupMember[] }>>(url)
  );

  return data.members;
}

export async function addGroupMember(workspaceId: string, groupId: string, email: string) {
  const url = `/api/group/workspace/${workspaceId}/${groupId}/member`;

  return executeAPIVoidRequest(() =>
    getAxios()?.post<APIResponse>(url, { email })
  );
}

export async function removeGroupMember(workspaceId: string, groupId: string, uid: number) {
  const url = `/api/group/workspace/${workspaceId}/${groupId}/member/${uid}`;

  return executeAPIVoidRequest(() =>
    getAxios()?.delete<APIResponse>(url)
  );
}

export async function grantGroupAccess(
  workspaceId: string,
  groupId: string,
  params: { objectType: GrantObjectType; objectId: string; accessLevel: AccessLevel }
) {
  const url = `/api/group/workspace/${workspaceId}/${groupId}/grant`;

  return executeAPIVoidRequest(() =>
    getAxios()?.put<APIResponse>(url, {
      object_type: params.objectType,
      object_id: params.objectId,
      access_level: params.accessLevel,
    })
  );
}
