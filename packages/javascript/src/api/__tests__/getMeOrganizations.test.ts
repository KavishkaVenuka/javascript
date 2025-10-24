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
import getMeOrganizations from '../getMeOrganizations';
import AsgardeoAPIError from '../../errors/AsgardeoAPIError';
import type {Organization} from '../../models/organization';

describe('getMeOrganizations', (): void => {
  beforeEach((): void => {
    vi.resetAllMocks();
  });

  it('should fetch associated orgs successfully (default fetch)', async (): Promise<void> => {
    const mock: {organizations: Organization[]} = {
      organizations: [
        {id: 'o1', name: 'One', orgHandle: 'one'},
        {id: 'o2', name: 'Two', orgHandle: 'two'},
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mock),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const result = await getMeOrganizations({baseUrl});

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/users/v1/me/organizations?limit=10&recursive=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    expect(result).toEqual(mock.organizations);
  });

  it('should append query params when provided', async (): Promise<void> => {
    const mock = {organizations: [] as Organization[]};

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mock),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    await getMeOrganizations({
      baseUrl,
      after: 'YWZ0',
      before: 'YmZy',
      authorizedAppName: 'my-app',
      filter: 'name co "acme"',
      limit: 25,
      recursive: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/users/v1/me/organizations?after=YWZ0&authorizedAppName=my-app&before=YmZy&filter=name+co+%22acme%22&limit=25&recursive=true`,
      expect.any(Object),
    );
  });

  it('should use custom fetcher when provided', async (): Promise<void> => {
    const mock = {organizations: [{id: 'o1', name: 'C', orgHandle: 'c'}]};

    const customFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mock),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const result = await getMeOrganizations({baseUrl, fetcher: customFetcher});

    expect(result).toEqual(mock.organizations);
    expect(customFetcher).toHaveBeenCalledWith(
      `${baseUrl}/api/users/v1/me/organizations?limit=10&recursive=false`,
      expect.objectContaining({method: 'GET'}),
    );
  });

  it('should handle errors thrown directly by custom fetcher', async (): Promise<void> => {
    const customFetcher = vi.fn().mockImplementation(() => {
      throw new Error('Custom fetcher failure');
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(getMeOrganizations({baseUrl, fetcher: customFetcher})).rejects.toThrow(
      'Network or parsing error: Custom fetcher failure',
    );
  });

  it('should throw AsgardeoAPIError for invalid base URL', async (): Promise<void> => {
    await expect(getMeOrganizations({baseUrl: 'invalid-url' as any})).rejects.toThrow(AsgardeoAPIError);
    await expect(getMeOrganizations({baseUrl: 'invalid-url' as any})).rejects.toThrow('Invalid base URL provided.');
  });

  it('should throw AsgardeoAPIError for undefined baseUrl', async (): Promise<void> => {
    await expect(getMeOrganizations({baseUrl: undefined as any})).rejects.toThrow(AsgardeoAPIError);
    await expect(getMeOrganizations({baseUrl: undefined as any})).rejects.toThrow('Invalid base URL provided.');
  });

  it('should throw AsgardeoAPIError for empty string baseUrl', async (): Promise<void> => {
    await expect(getMeOrganizations({baseUrl: ''})).rejects.toThrow(AsgardeoAPIError);
    await expect(getMeOrganizations({baseUrl: ''})).rejects.toThrow('Invalid base URL provided.');
  });

  it('should handle HTTP error responses', async (): Promise<void> => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: () => Promise.resolve('Not authorized'),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(getMeOrganizations({baseUrl})).rejects.toThrow(AsgardeoAPIError);
    await expect(getMeOrganizations({baseUrl})).rejects.toThrow(
      'Failed to fetch associated organizations of the user: Not authorized',
    );
  });

  it('should handle network or parsing errors', async (): Promise<void> => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(getMeOrganizations({baseUrl})).rejects.toThrow(AsgardeoAPIError);
    await expect(getMeOrganizations({baseUrl})).rejects.toThrow('Network or parsing error: Network error');
  });

  it('should handle non-Error rejections', async (): Promise<void> => {
    global.fetch = vi.fn().mockRejectedValue('unexpected failure');

    const baseUrl = 'https://api.asgardeo.io/t/demo';

    await expect(getMeOrganizations({baseUrl})).rejects.toThrow('Network or parsing error: Unknown error');
  });

  it('should include custom headers when provided', async (): Promise<void> => {
    const mock = {organizations: [] as Organization[]};

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mock),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const customHeaders = {
      Authorization: 'Bearer token',
      'X-Custom-Header': 'custom-value',
    };

    await getMeOrganizations({baseUrl, headers: customHeaders});

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/users/v1/me/organizations?limit=10&recursive=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer token',
        'X-Custom-Header': 'custom-value',
      },
    });
  });

  it('should return [] if response has no organizations property', async (): Promise<void> => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}), // missing organizations
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const result = await getMeOrganizations({baseUrl});

    expect(result).toEqual([]);
  });

  it('should include custom headers when provided', async (): Promise<void> => {
    const mock = {organizations: [] as Organization[]};

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mock),
    });

    const baseUrl = 'https://api.asgardeo.io/t/demo';
    const customHeaders = {
      Authorization: 'Bearer token',
      'X-Custom-Header': 'custom-value',
    };

    await getMeOrganizations({baseUrl, headers: customHeaders});
    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/users/v1/me/organizations?limit=10&recursive=false`, {
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
