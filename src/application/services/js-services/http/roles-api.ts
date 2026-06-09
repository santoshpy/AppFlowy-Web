import { Capability, CustomRole } from '@/application/types';

import { APIResponse, executeAPIRequest, executeAPIVoidRequest, getAxios } from './core';

// Custom roles + capabilities (Phase 3). Role management is gated by the
// 'role.manage' capability (owners always have it).

export async function getCapabilities(workspaceId: string): Promise<Capability[]> {
  const url = `/api/role/workspace/${workspaceId}/capabilities`;

  const data = await executeAPIRequest<{ capabilities: Capability[] }>(() =>
    getAxios()?.get<APIResponse<{ capabilities: Capability[] }>>(url)
  );

  return data.capabilities;
}

// The current user's effective capabilities in the workspace (feeds useCan).
export async function getMyCapabilities(workspaceId: string): Promise<string[]> {
  const url = `/api/role/workspace/${workspaceId}/my-capabilities`;

  const data = await executeAPIRequest<{ capabilities: string[] }>(() =>
    getAxios()?.get<APIResponse<{ capabilities: string[] }>>(url)
  );

  return data.capabilities;
}

export async function getRoles(workspaceId: string): Promise<CustomRole[]> {
  const url = `/api/role/workspace/${workspaceId}`;

  const data = await executeAPIRequest<{ roles: CustomRole[] }>(() =>
    getAxios()?.get<APIResponse<{ roles: CustomRole[] }>>(url)
  );

  return data.roles;
}

export async function createRole(
  workspaceId: string,
  params: { name: string; description?: string; capabilities: string[] }
): Promise<number> {
  const url = `/api/role/workspace/${workspaceId}`;

  return executeAPIRequest<number>(() =>
    getAxios()?.post<APIResponse<number>>(url, {
      name: params.name,
      description: params.description ?? null,
      capabilities: params.capabilities,
    })
  );
}

export async function updateRole(
  workspaceId: string,
  roleId: number,
  params: { name: string; description?: string; capabilities: string[] }
) {
  const url = `/api/role/workspace/${workspaceId}/${roleId}`;

  return executeAPIVoidRequest(() =>
    getAxios()?.put<APIResponse>(url, {
      name: params.name,
      description: params.description ?? null,
      capabilities: params.capabilities,
    })
  );
}

export async function deleteRole(workspaceId: string, roleId: number) {
  const url = `/api/role/workspace/${workspaceId}/${roleId}`;

  return executeAPIVoidRequest(() =>
    getAxios()?.delete<APIResponse>(url)
  );
}

export async function assignRole(workspaceId: string, params: { email: string; roleId: number }) {
  const url = `/api/role/workspace/${workspaceId}/assign`;

  return executeAPIVoidRequest(() =>
    getAxios()?.post<APIResponse>(url, { email: params.email, role_id: params.roleId })
  );
}

export async function unassignRole(workspaceId: string, roleId: number, uid: number) {
  const url = `/api/role/workspace/${workspaceId}/${roleId}/user/${uid}`;

  return executeAPIVoidRequest(() =>
    getAxios()?.delete<APIResponse>(url)
  );
}
