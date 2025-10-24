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
import {EmbeddedSignInFlowHandleResponse} from '../models/embedded-signin-flow';

const executeEmbeddedSignInFlow = async ({
  url,
  baseUrl,
  payload,
  ...requestConfig
}: EmbeddedFlowExecuteRequestConfig): Promise<EmbeddedSignInFlowHandleResponse> => {
  try {
    new URL(url ?? baseUrl);
  } catch (error) {
    throw new AsgardeoAPIError(
      `Invalid URL provided. ${error?.toString()}`,
      'executeEmbeddedSignInFlow-ValidationError-001',
      'javascript',
      400,
      'The provided `url` or `baseUrl` path does not adhere to the URL schema.',
    );
  }

  if (!payload) {
    throw new AsgardeoAPIError(
      'Authorization payload is required',
      'executeEmbeddedSignInFlow-ValidationError-002',
      'javascript',
      400,
      'If an authorization payload is not provided, the request cannot be constructed correctly.',
    );
  }

  try {
    const response: Response = await fetch(url ?? `${baseUrl}/oauth2/authn`, {
      ...requestConfig,
      method: requestConfig.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...requestConfig.headers,
      },
      body: JSON.stringify(payload),
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

    return (await response.json()) as EmbeddedSignInFlowHandleResponse;
  } catch (error) {
    if (error instanceof AsgardeoAPIError) {
      throw error;
    }

    throw new AsgardeoAPIError(
      `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'executeEmbeddedSignInFlow-NetworkError-001',
      'javascript',
      0,
      'Network Error',
    );
  }
};

export default executeEmbeddedSignInFlow;
