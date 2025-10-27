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

// src/server/actions/__tests__/getAllOrganizations.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

// --- Mocks MUST be defined before importing the SUT ---
vi.mock('../../../AsgardeoNextClient', () => ({
  default: {
    getInstance: vi.fn(),
  },
}));

vi.mock('../getSessionId', () => ({
  default: vi.fn(),
}));

// --- Now import the SUT and mocked deps ---
import getAllOrganizations from '../getAllOrganizations';
import AsgardeoNextClient from '../../../AsgardeoNextClient';
import getSessionId from '../getSessionId';
import { AsgardeoAPIError, AllOrganizationsApiResponse } from '@asgardeo/node';

describe('getAllOrganizations (Next.js server action)', () => {
  const mockClient = {
    getAllOrganizations: vi.fn(),
  };

  const baseOptions = { limit: 50, cursor: 'cur-1', filter: 'type eq "TENANT"' };

  const mockResponse: AllOrganizationsApiResponse = {
    data: [
      { id: 'org-001', name: 'Alpha', orgHandle: 'alpha' },
      { id: 'org-002', name: 'Beta', orgHandle: 'beta' },
    ],
    meta: { totalResults: 2, startIndex: 1, itemsPerPage: 2 },
  } as unknown as AllOrganizationsApiResponse;

  beforeEach(() => {
    vi.resetAllMocks();

    // Default: getInstance returns our mock client
    (AsgardeoNextClient.getInstance as unknown as Mock).mockReturnValue(mockClient);
    // Default: session id resolver returns a value
    (getSessionId as unknown as Mock).mockResolvedValue('sess-abc');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns organizations when a sessionId is provided (no getSessionId fallback)', async () => {
    mockClient.getAllOrganizations.mockResolvedValueOnce(mockResponse);

    const result = await getAllOrganizations(baseOptions, 'sess-123');

    expect(AsgardeoNextClient.getInstance).toHaveBeenCalledTimes(1);
    expect(getSessionId).not.toHaveBeenCalled();
    expect(mockClient.getAllOrganizations).toHaveBeenCalledWith(baseOptions, 'sess-123');
    expect(result).toBe(mockResponse);
  });

  it('falls back to getSessionId when sessionId is undefined', async () => {
    mockClient.getAllOrganizations.mockResolvedValueOnce(mockResponse);

    const result = await getAllOrganizations(baseOptions, undefined);

    expect(getSessionId).toHaveBeenCalledTimes(1);
    expect(mockClient.getAllOrganizations).toHaveBeenCalledWith(baseOptions, 'sess-abc');
    expect(result).toBe(mockResponse);
  });

  it('falls back to getSessionId when sessionId is null', async () => {
    mockClient.getAllOrganizations.mockResolvedValueOnce(mockResponse);

    const result = await getAllOrganizations(baseOptions, null as unknown as string);

    expect(getSessionId).toHaveBeenCalledTimes(1);
    expect(mockClient.getAllOrganizations).toHaveBeenCalledWith(baseOptions, 'sess-abc');
    expect(result).toBe(mockResponse);
  });

  it('does not call getSessionId for an empty string sessionId (empty string is not nullish)', async () => {
    mockClient.getAllOrganizations.mockResolvedValueOnce(mockResponse);

    const result = await getAllOrganizations(baseOptions, '');

    expect(getSessionId).not.toHaveBeenCalled();
    expect(mockClient.getAllOrganizations).toHaveBeenCalledWith(baseOptions, '');
    expect(result).toBe(mockResponse);
  });

  it('wraps an AsgardeoAPIError thrown by client.getAllOrganizations, preserving statusCode', async () => {
    const upstream = new AsgardeoAPIError(
      'Upstream failed',
      'ORG_LIST_500',
      'server',
      503,
    );
    mockClient.getAllOrganizations.mockRejectedValueOnce(upstream);

    await expect(getAllOrganizations(baseOptions, 'sess-x')).rejects.toMatchObject({
      constructor: AsgardeoAPIError,
      statusCode: 503,
      message: expect.stringContaining('Failed to get all the organizations for the user: Upstream failed'),
    });
  });

});

