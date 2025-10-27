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
import getOrganization from '../getOrganization';
import AsgardeoAPIError from '../../errors/AsgardeoAPIError';
import type {OrganizationDetails} from '../getOrganization';

describe('getOrganization', (): void => {
  beforeEach((): void => {
    vi.resetAllMocks();
  });

  it('should fetch organization details successfully (default fetch)', async (): Promise<void> => {
    const mockOrg: OrganizationDetails = {
      id: '0d5e071b-d3d3-475d-b3c6-1a20ee2fa9b1',
      name: 'DX Lab',
      orgHandle: 'dxlab',
      description: 'Demo org',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrg),
    });

    const baseUrl = 'https://api.asgardeo.io/t/dxlab';
    const organizationId = mockOrg.id;
    const result = await getOrganization({baseUrl, organizationId});

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/server/v1/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    expect(result).toEqual(mockOrg);
  });

  it('should use custom fetcher when provided', async (): Promise<void> => {
    const mockOrg: OrganizationDetails = {
      id: 'org-123',
      name: 'Custom Org',
      orgHandle: 'custom-org',
    };

    const customFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrg),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const organizationId = 'org-123';
    const result = await getOrganization({
      baseUrl,
      organizationId,
      fetcher: customFetcher,
    });

    expect(result).toEqual(mockOrg);
    expect(customFetcher).toHaveBeenCalledWith(
      `${baseUrl}/api/server/v1/organizations/${organizationId}`,
      expect.objectContaining({
        method: 'GET',
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

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const organizationId = 'org-1';

    await expect(getOrganization({baseUrl, organizationId, fetcher: customFetcher})).rejects.toThrow(
      'Network or parsing error: Custom fetcher failure',
    );
  });

  it('should throw AsgardeoAPIError for invalid base URL', async (): Promise<void> => {
    await expect(getOrganization({baseUrl: 'invalid-url' as any, organizationId: 'org-1'})).rejects.toThrow(
      AsgardeoAPIError,
    );
    // Substring match is fine because the implementation appends the native error text
    await expect(getOrganization({baseUrl: 'invalid-url' as any, organizationId: 'org-1'})).rejects.toThrow(
      'Invalid base URL provided.',
    );
  });

  it('should throw AsgardeoAPIError for undefined baseUrl', async (): Promise<void> => {
    await expect(getOrganization({baseUrl: undefined as any, organizationId: 'org-1'})).rejects.toThrow(
      AsgardeoAPIError,
    );
    await expect(getOrganization({baseUrl: undefined as any, organizationId: 'org-1'})).rejects.toThrow(
      'Invalid base URL provided.',
    );
  });

  it('should throw AsgardeoAPIError for empty string baseUrl', async (): Promise<void> => {
    await expect(getOrganization({baseUrl: '', organizationId: 'org-1'})).rejects.toThrow(AsgardeoAPIError);
    await expect(getOrganization({baseUrl: '', organizationId: 'org-1'})).rejects.toThrow('Invalid base URL provided.');
  });

  it('should throw AsgardeoAPIError when organizationId is missing', async (): Promise<void> => {
    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(getOrganization({baseUrl, organizationId: '' as any})).rejects.toThrow(AsgardeoAPIError);
    await expect(getOrganization({baseUrl, organizationId: '' as any})).rejects.toThrow('Organization ID is required');
  });

  it('should handle HTTP error responses', async (): Promise<void> => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Organization not found'),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const organizationId = 'missing-org';

    await expect(getOrganization({baseUrl, organizationId})).rejects.toThrow(AsgardeoAPIError);
    await expect(getOrganization({baseUrl, organizationId})).rejects.toThrow(
      'Failed to fetch organization details: Organization not found',
    );
  });

  it('should handle network or parsing errors', async (): Promise<void> => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const organizationId = 'org-1';

    await expect(getOrganization({baseUrl, organizationId})).rejects.toThrow(AsgardeoAPIError);
    await expect(getOrganization({baseUrl, organizationId})).rejects.toThrow('Network or parsing error: Network error');
  });

  it('should handle non-Error rejections', async (): Promise<void> => {
    global.fetch = vi.fn().mockRejectedValue('unexpected failure');

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const organizationId = 'org-1';

    await expect(getOrganization({baseUrl, organizationId})).rejects.toThrow('Network or parsing error: Unknown error');
  });

  it('should include custom headers when provided', async (): Promise<void> => {
    const mockOrg: OrganizationDetails = {
      id: 'org-003',
      name: 'Header Org',
      orgHandle: 'header-org',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrg),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const organizationId = 'org-003';
    const customHeaders = {
      Authorization: 'Bearer token',
      'X-Custom-Header': 'custom-value',
    };

    await getOrganization({
      baseUrl,
      organizationId,
      headers: customHeaders,
    });

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/server/v1/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer token',
        'X-Custom-Header': 'custom-value',
      },
    });
  });
});
