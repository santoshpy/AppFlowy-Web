import { Organization, OrganizationMember } from '@/application/types';

import { APIResponse, executeAPIRequest, executeAPIVoidRequest, getAxios } from './core';

// Organization tier (Model B). An organization groups multiple workspaces under
// central administration. Member management is org-admin-gated on the backend
// (non-admins receive a permission error).

export async function getOrganizations(): Promise<Organization[]> {
  const url = `/api/organization`;

  const data = await executeAPIRequest<{ items: Organization[] }>(() =>
    getAxios()?.get<APIResponse<{ items: Organization[] }>>(url)
  );

  return data.items;
}

export async function createOrganization(params: { name: string }): Promise<Organization> {
  const url = `/api/organization`;

  return executeAPIRequest<Organization>(() =>
    getAxios()?.post<APIResponse<Organization>>(url, { name: params.name })
  );
}

export async function getOrgMembers(orgId: string): Promise<OrganizationMember[]> {
  const url = `/api/organization/${orgId}/member`;

  const data = await executeAPIRequest<{ items: OrganizationMember[] }>(() =>
    getAxios()?.get<APIResponse<{ items: OrganizationMember[] }>>(url)
  );

  return data.items;
}

export async function addOrgMember(orgId: string, params: { email: string; role: number }) {
  const url = `/api/organization/${orgId}/member`;

  return executeAPIVoidRequest(() =>
    getAxios()?.post<APIResponse>(url, { email: params.email, role: params.role })
  );
}

export async function removeOrgMember(orgId: string, uid: string) {
  const url = `/api/organization/${orgId}/member/${uid}`;

  return executeAPIVoidRequest(() =>
    getAxios()?.delete<APIResponse>(url)
  );
}

export async function attachWorkspaceToOrg(orgId: string, workspaceId: string) {
  const url = `/api/organization/${orgId}/workspace/${workspaceId}`;

  return executeAPIVoidRequest(() =>
    getAxios()?.put<APIResponse>(url)
  );
}
