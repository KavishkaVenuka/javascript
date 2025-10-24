/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// src/server/actions/__tests__/getCurrentOrganizationAction.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// --- Mock client factory BEFORE importing SUT ---
vi.mock('../../../AsgardeoNextClient', () => ({
  default: {
    getInstance: vi.fn(),
  },
}));

// --- Import SUT and mocked deps ---
import getCurrentOrganizationAction from '../getCurrentOrganizationAction';
import AsgardeoNextClient from '../../../AsgardeoNextClient';

// A light org shape for testing (only fields we assert on)
type Org = { id: string; name: string; orgHandle?: string };

describe('getCurrentOrganizationAction', () => {
  const mockClient = {
    getCurrentOrganization: vi.fn(),
  };

  const sessionId = 'sess-123';
  const org: Org = { id: 'org-001', name: 'Alpha', orgHandle: 'alpha' };

  beforeEach(() => {
    vi.resetAllMocks();
    (AsgardeoNextClient.getInstance as unknown as Mock).mockReturnValue(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success with organization when upstream succeeds', async () => {
    mockClient.getCurrentOrganization.mockResolvedValueOnce(org);

    const result = await getCurrentOrganizationAction(sessionId);

    expect(AsgardeoNextClient.getInstance).toHaveBeenCalledTimes(1);
    expect(mockClient.getCurrentOrganization).toHaveBeenCalledWith(sessionId);

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data.organization).toEqual(org);
  });

  it('should pass through the provided sessionId even if it is an empty string', async () => {
    mockClient.getCurrentOrganization.mockResolvedValueOnce(org);

    const result = await getCurrentOrganizationAction('');

    expect(mockClient.getCurrentOrganization).toHaveBeenCalledWith('');
    expect(result.success).toBe(true);
    expect(result.data.organization).toEqual(org);
  });

  it('should return failure shape when client.getCurrentOrganization rejects', async () => {
    mockClient.getCurrentOrganization.mockRejectedValueOnce(new Error('upstream down'));

    const result = await getCurrentOrganizationAction(sessionId);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to get the current organization');
    // Matches the function’s failure payload shape
    expect(result.data).toEqual({ user: {} });
  });

  it('should return failure shape when AsgardeoNextClient.getInstance throws', async () => {
    (AsgardeoNextClient.getInstance as unknown as Mock).mockImplementationOnce(() => {
      throw new Error('factory failed');
    });

    const result = await getCurrentOrganizationAction(sessionId);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to get the current organization');
    expect(result.data).toEqual({ user: {} });
  });

  it('should not mutate the organization object returned by upstream', async () => {
    const upstreamOrg = { ...org, extra: { nested: true } };
    mockClient.getCurrentOrganization.mockResolvedValueOnce(upstreamOrg);

    const result = await getCurrentOrganizationAction(sessionId);

    // exact deep equality: whatever upstream returns is passed through
    expect(result.data.organization).toEqual(upstreamOrg);
  });
});
