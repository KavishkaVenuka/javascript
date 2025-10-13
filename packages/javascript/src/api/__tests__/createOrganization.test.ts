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

import {describe, it, expect, vi, beforeEach} from 'vitest';
import createOrganization, {CreateOrganizationPayload} from '../createOrganization';
import AsgardeoAPIError from '../../errors/AsgardeoAPIError';
import {Organization} from '../../models/organization';

describe('createOrganization', (): void => {
  beforeEach((): void => {
    vi.resetAllMocks();
  });

  it('should create organization successfully with default fetch', async (): Promise<void> => {
    const mockOrg: Organization = {
      id: 'org-001',
      name: 'Team Viewer',
      orgHandle: 'team-viewer',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrg),
    });

    const payload: CreateOrganizationPayload = {
      description: 'Screen sharing organization',
      name: 'Team Viewer',
      orgHandle: 'team-viewer',
      parentId: 'parent-123',
      type: 'TENANT',
    };

    const baseUrl: string = 'https://api.asgardeo.io/t/demo';
    const result = await createOrganization({baseUrl, payload});

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/server/v1/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockOrg);
  });

  it('should use custom fetcher when provided', async (): Promise<void> => {
    const mockOrg: Organization = {
      id: 'org-002',
      name: 'Demo Org',
      orgHandle: 'demo-org',
    };

    const customFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrg),
    });

    const payload: CreateOrganizationPayload = {
      description: 'Example org',
      name: 'Demo Org',
      parentId: 'p123',
      type: 'TENANT',
    };

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const result = await createOrganization({
      baseUrl,
      payload,
      fetcher: customFetcher,
    });

    expect(result).toEqual(mockOrg);
    expect(customFetcher).toHaveBeenCalledWith(
      `${baseUrl}/api/server/v1/organizations`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    );
  });

  it('should handle errors thrown directly by custom fetcher', async (): Promise<void> => {
    const customFetcher = vi.fn().mockImplementation(() => {
      throw new Error('Custom fetcher failure');
    });

    const payload: CreateOrganizationPayload = {
      description: 'Error via fetcher',
      name: 'Fetcher Org',
      parentId: 'p222',
      type: 'TENANT',
    };

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(createOrganization({baseUrl, payload, fetcher: customFetcher})).rejects.toThrow(
      'Network or parsing error: Custom fetcher failure',
    );
  });

  it('should throw AsgardeoAPIError for invalid base URL', async (): Promise<void> => {
    const payload: CreateOrganizationPayload = {
      description: 'Invalid test',
      name: 'Broken Org',
      parentId: 'p1',
      type: 'TENANT',
    };

    await expect(createOrganization({baseUrl: 'invalid-url', payload})).rejects.toThrow(AsgardeoAPIError);
    await expect(createOrganization({baseUrl: 'invalid-url', payload})).rejects.toThrow('Invalid base URL provided.');
  });

  it('should throw AsgardeoAPIError for undefined baseUrl', async (): Promise<void> => {
    const payload: CreateOrganizationPayload = {
      description: 'No URL test',
      name: 'Broken Org',
      parentId: 'p1',
      type: 'TENANT',
    };

    await expect(createOrganization({baseUrl: undefined, payload})).rejects.toThrow(AsgardeoAPIError);
    await expect(createOrganization({baseUrl: undefined, payload})).rejects.toThrow('Invalid base URL provided.');
  });

  it('should throw AsgardeoAPIError for empty string baseUrl', async (): Promise<void> => {
    const payload: CreateOrganizationPayload = {
      description: 'Empty URL test',
      name: 'Broken Org',
      parentId: 'p1',
      type: 'TENANT',
    };
    await expect(createOrganization({baseUrl: '', payload})).rejects.toThrow(AsgardeoAPIError);
    await expect(createOrganization({baseUrl: '', payload})).rejects.toThrow('Invalid base URL provided.');
  });

  it('should throw AsgardeoAPIError when payload is missing', async (): Promise<void> => {
    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(createOrganization({baseUrl} as any)).rejects.toThrow(AsgardeoAPIError);
    await expect(createOrganization({baseUrl} as any)).rejects.toThrow('Organization payload is required');
  });

  it("should always set type to 'TENANT' in payload", async (): Promise<void> => {
    const mockOrg: Organization = {
      id: 'org-002',
      name: 'Demo Org',
      orgHandle: 'demo-org',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrg),
    });

    const payload: CreateOrganizationPayload = {
      description: 'Example org',
      name: 'Demo Org',
      parentId: 'p123',
      type: 'GROUP', // Intentionally incorrect to test override
    };

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    await createOrganization({baseUrl, payload});

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/server/v1/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        type: 'TENANT',
      }),
    });
  });

  it('should handle HTTP error responses', async (): Promise<void> => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve('Invalid organization data'),
    });

    const payload: CreateOrganizationPayload = {
      description: 'Error test',
      name: 'Bad Org',
      parentId: 'p99',
      type: 'TENANT',
    };

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(createOrganization({baseUrl, payload})).rejects.toThrow(AsgardeoAPIError);
    await expect(createOrganization({baseUrl, payload})).rejects.toThrow(
      'Failed to create organization: Invalid organization data',
    );
  });

  it('should handle network or parsing errors', async (): Promise<void> => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const payload: CreateOrganizationPayload = {
      description: 'Network issue',
      name: 'Fail Org',
      parentId: 'p404',
      type: 'TENANT',
    };

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(createOrganization({baseUrl, payload})).rejects.toThrow(AsgardeoAPIError);
    await expect(createOrganization({baseUrl, payload})).rejects.toThrow('Network or parsing error: Network error');
  });

  it('should handle non-Error rejections', async (): Promise<void> => {
    global.fetch = vi.fn().mockRejectedValue('unexpected failure');

    const payload: CreateOrganizationPayload = {
      description: 'Unknown error org',
      name: 'Unknown Org',
      parentId: 'p000',
      type: 'TENANT',
    };

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(createOrganization({baseUrl, payload})).rejects.toThrow('Network or parsing error: Unknown error');
  });

  it('should pass through custom headers', async (): Promise<void> => {
    const mockOrg: Organization = {
      id: 'org-003',
      name: 'Header Org',
      orgHandle: 'header-org',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrg),
    });

    const payload: CreateOrganizationPayload = {
      description: 'Header test org',
      name: 'Header Org',
      parentId: 'p456',
      type: 'TENANT',
    };

    const customHeaders = {
      Authorization: 'Bearer token',
      'X-Custom-Header': 'custom-value',
    };

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await createOrganization({
      baseUrl,
      payload,
      headers: customHeaders,
    });

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/server/v1/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer token',
        'X-Custom-Header': 'custom-value',
      },
      body: JSON.stringify(payload),
    });
  });
});
