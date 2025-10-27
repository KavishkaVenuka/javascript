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

// src/server/actions/__tests__/getBrandingPreference.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// Mock the upstream module first. Keep all dependencies inside the factory.
vi.mock('@asgardeo/node', () => {
  const getBrandingPreference = vi.fn();

  class MockAsgardeoAPIError extends Error {
    code?: string;
    source?: string;
    statusCode?: number;
    constructor(message: string, code?: string, source?: string, statusCode?: number) {
      super(message);
      this.name = 'AsgardeoAPIError';
      this.code = code;
      this.source = source;
      this.statusCode = statusCode;
    }
  }

  return {
    AsgardeoAPIError: MockAsgardeoAPIError,
    getBrandingPreference,
  };
});

// Now import SUT and mocked exports
import getBrandingPreference from '../getBrandingPreference';
import {
  AsgardeoAPIError,
  getBrandingPreference as baseGetBrandingPreference,
} from '@asgardeo/node';

describe('getBrandingPreference (Next.js server action)', () => {
  type BrandingPreference = Awaited<ReturnType<typeof getBrandingPreference>>;
  type Cfg = Parameters<typeof getBrandingPreference>[0];

  const cfg: Cfg = { orgId: 'org-001', locale: 'en-US' } as unknown as Cfg;

  const mockPref: BrandingPreference = {
    theme: { colors: { primary: '#0055aa' } },
    logoUrl: 'https://cdn.example.com/logo.png',
  } as unknown as BrandingPreference;

  beforeEach(() => {
    vi.resetAllMocks();
    (baseGetBrandingPreference as unknown as Mock).mockResolvedValue(mockPref);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return branding preferences when upstream succeeds', async () => {
    const result = await getBrandingPreference(cfg, 'sess-123');

    expect(baseGetBrandingPreference).toHaveBeenCalledTimes(1);
    expect(baseGetBrandingPreference).toHaveBeenCalledWith(cfg);

    // Ensure sessionId is not forwarded
    const call = (baseGetBrandingPreference as unknown as Mock).mock.calls[0];
    expect(call.length).toBe(1);

    expect(result).toBe(mockPref);
  });

  it('should wrap an AsgardeoAPIError from upstream, preserving statusCode', async () => {
    const upstream = new AsgardeoAPIError('Not found', 'BRAND_404', 'server', 404);
    (baseGetBrandingPreference as unknown as Mock).mockRejectedValueOnce(upstream);

    await expect(getBrandingPreference(cfg)).rejects.toMatchObject({
      constructor: AsgardeoAPIError,
      statusCode: 404,
      message: expect.stringContaining('Failed to get branding preferences: Not found'),
    });
  });

  it('should wrap a generic Error with undefined statusCode', async () => {
    (baseGetBrandingPreference as unknown as Mock).mockRejectedValueOnce(
      new Error('network down'),
    );

    await expect(getBrandingPreference(cfg)).rejects.toMatchObject({
      constructor: AsgardeoAPIError,
      statusCode: undefined,
      message: expect.stringContaining('Failed to get branding preferences: network down'),
    });
  });

  it('should wrap a non-Error rejection value using String(error)', async () => {
    (baseGetBrandingPreference as unknown as Mock).mockRejectedValueOnce('boom');

    await expect(getBrandingPreference(cfg)).rejects.toMatchObject({
      constructor: AsgardeoAPIError,
      statusCode: undefined,
      message: expect.stringContaining('Failed to get branding preferences: boom'),
    });
  });
});
