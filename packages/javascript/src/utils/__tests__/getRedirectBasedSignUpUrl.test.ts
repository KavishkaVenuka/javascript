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

import {describe, it, expect, vi, afterEach} from 'vitest';
import {Config} from '../../models/config';
import isRecognizedBaseUrlPattern from '../isRecognizedBaseUrlPattern';
import getRedirectBasedSignUpUrl from '../getRedirectBasedSignUpUrl';

vi.mock('../isRecognizedBaseUrlPattern', () => ({default: vi.fn()}));

describe('getRedirectBasedSignUpUrl', () => {
  const baseUrl: string = 'https://api.asgardeo.io/t/org';
  const expectedBaseUrl: string = 'https://accounts.asgardeo.io/t/org';
  const clientId: string = 'client123';
  const applicationId: string = 'app456';

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the correct sign-up URL if baseUrl is recognized and both params are present', () => {
    (isRecognizedBaseUrlPattern as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const config: Config = {baseUrl, clientId, applicationId};
    const url: URL = new URL(expectedBaseUrl + '/accountrecoveryendpoint/register.do');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('spId', applicationId);
    expect(getRedirectBasedSignUpUrl(config)).toBe(url.toString());
  });

  it('should return the correct sign-up URL if only clientId is present', () => {
    (isRecognizedBaseUrlPattern as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const config: Config = {baseUrl, clientId};
    const url: URL = new URL(expectedBaseUrl + '/accountrecoveryendpoint/register.do');
    url.searchParams.set('client_id', clientId);
    expect(getRedirectBasedSignUpUrl(config)).toBe(url.toString());
  });

  it('should return the correct sign-up URL if only applicationId is present', () => {
    (isRecognizedBaseUrlPattern as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const config: Config = {baseUrl, applicationId, clientId: ''};
    const url: URL = new URL(expectedBaseUrl + '/accountrecoveryendpoint/register.do');
    url.searchParams.set('spId', applicationId);
    expect(getRedirectBasedSignUpUrl(config)).toBe(url.toString());
  });

  it('should return the correct sign-up URL if neither param is present', () => {
    (isRecognizedBaseUrlPattern as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const config: Config = {baseUrl, clientId: ''};
    const url: URL = new URL(expectedBaseUrl + '/accountrecoveryendpoint/register.do');
    expect(getRedirectBasedSignUpUrl(config)).toBe(url.toString());
  });

  it('should return empty string if baseUrl is not recognized', () => {
    (isRecognizedBaseUrlPattern as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const config: Config = {baseUrl, clientId, applicationId};
    expect(getRedirectBasedSignUpUrl(config)).toBe('');
  });
});
