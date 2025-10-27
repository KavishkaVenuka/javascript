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

import AsgardeoAPIError from '../errors/AsgardeoAPIError';
import {EmbeddedFlowExecuteRequestConfig} from '../models/embedded-flow';
import {EmbeddedSignInFlowInitiateResponse} from '../models/embedded-signin-flow';

/**
 * Sends an authorization request to the specified OAuth2/OIDC authorization endpoint.
 *
 * @param requestConfig - Request configuration object containing URL and payload.
 * @returns A promise that resolves with the authorization response.
 * @throws AsgardeoAPIError when the request fails or URL is invalid.
 *
 * @example
 * ```typescript
 * try {
 *   const authResponse = await initializeEmbeddedSignInFlow({
 *     url: "https://api.asgardeo.io/t/<ORGANIZATION>/oauth2/authorize",
 *     payload: {
 *       response_type: "code",
 *       client_id: "your-client-id",
 *       redirect_uri: "https://your-app.com/callback",
 *       scope: "openid profile email",
 *       state: "random-state-value",
 *       code_challenge: "your-pkce-challenge",
 *       code_challenge_method: "S256"
 *     }
 *   });
 *   console.log(authResponse);
 * } catch (error) {
 *   if (error instanceof AsgardeoAPIError) {
 *     console.error('Authorization failed:', error.message);
 *   }
 * }
 * ```
 */
const initializeEmbeddedSignInFlow = async ({
  url,
  baseUrl,
  payload,
  ...requestConfig
}: EmbeddedFlowExecuteRequestConfig): Promise<EmbeddedSignInFlowInitiateResponse> => {
  try {
    new URL(url ?? baseUrl);
  } catch (error) {
    throw new AsgardeoAPIError(
      `Invalid URL provided. ${error?.toString()}`,
      'getSchemas-ValidationError-001',
      'javascript',
      400,
      'The provided `url` or `baseUrl` path does not adhere to the URL schema.',
    );
  }

  if (!payload) {
    throw new AsgardeoAPIError(
      'Authorization payload is required',
      'initializeEmbeddedSignInFlow-ValidationError-002',
      'javascript',
      400,
      'If an authorization payload is not provided, the request cannot be constructed correctly.',
    );
  }

  const searchParams = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  try {
    const response: Response = await fetch(url ?? `${baseUrl}/oauth2/authorize`, {
      ...requestConfig,
      method: requestConfig.method || 'POST',
      headers: {
        ...requestConfig.headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: searchParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new AsgardeoAPIError(
        `Authorization request failed: ${errorText}`,
        'initializeEmbeddedSignInFlow-ResponseError-001',
        'javascript',
        response.status,
        response.statusText,
      );
    }

    return (await response.json()) as EmbeddedSignInFlowInitiateResponse;
  } catch (error) {
    if (error instanceof AsgardeoAPIError) {
      throw error;
    }

    throw new AsgardeoAPIError(
      `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'initializeEmbeddedSignInFlow-NetworkError-001',
      'javascript',
      0,
      'Network Error',
    );
  }
};

export default initializeEmbeddedSignInFlow;
