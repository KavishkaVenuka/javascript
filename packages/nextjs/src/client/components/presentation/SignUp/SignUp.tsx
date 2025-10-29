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

'use client';

import {
  AsgardeoRuntimeError,
  EmbeddedFlowExecuteRequestPayload,
  EmbeddedFlowExecuteResponse,
  EmbeddedFlowResponseType,
  EmbeddedFlowType,
} from '@asgardeo/node';
import {FC} from 'react';
import {BaseSignUp, BaseSignUpProps} from '@asgardeo/react';
import useAsgardeo from '../../../contexts/Asgardeo/useAsgardeo';

/**
 * Props for the SignUp component.
 */
export type SignUpProps = BaseSignUpProps;

/**
 * A styled SignUp component that provides embedded sign-up flow with pre-built styling.
 * This component handles the API calls for sign-up and delegates UI logic to BaseSignUp.
 *
 * @example
 * ```tsx
 * import { SignUp } from '@asgardeo/react';
 *
 * const App = () => {
 *   return (
 *     <SignUp
 *       onSuccess={(response) => {
 *         console.log('Sign-up successful:', response);
 *         // Handle successful sign-up (e.g., redirect, show confirmation)
 *       }}
 *       onError={(error) => {
 *         console.error('Sign-up failed:', error);
 *       }}
 *       onComplete={(redirectUrl) => {
 *         // Platform-specific redirect handling (e.g., Next.js router.push)
 *         router.push(redirectUrl); // or window.location.href = redirectUrl
 *       }}
 *       size="medium"
 *       variant="outlined"
 *       afterSignUpUrl="/welcome"
 *     />
 *   );
 * };
 * ```
 */
const SignUp: FC<SignUpProps> = ({className, size = 'medium', variant = 'outlined', afterSignUpUrl, onError}) => {
  const {signUp, isInitialized} = useAsgardeo();

  /**
   * Initialize the sign-up flow.
   */
  const handleInitialize = async (
    payload?: EmbeddedFlowExecuteRequestPayload,
  ): Promise<EmbeddedFlowExecuteResponse> => {
    if (!signUp) {
      throw new AsgardeoRuntimeError(
        '`signUp` function is not available.',
        'SignUp-handleInitialize-RuntimeError-001',
        'nextjs',
      );
    }

    return (await signUp(
      payload || {
        flowType: EmbeddedFlowType.Registration,
      },
    )) as unknown as Promise<EmbeddedFlowExecuteResponse>;
  };

  /**
   * Handle sign-up steps.
   */
  const handleOnSubmit = async (payload: EmbeddedFlowExecuteRequestPayload): Promise<EmbeddedFlowExecuteResponse> => {
    if (!signUp) {
      throw new AsgardeoRuntimeError(
        '`signUp` function is not available.',
        'SignUp-handleOnSubmit-RuntimeError-001',
        'nextjs',
      );
    }

    return (await signUp(payload)) as unknown as Promise<EmbeddedFlowExecuteResponse>;
  };

  return (
    <BaseSignUp
      afterSignUpUrl={afterSignUpUrl}
      onInitialize={handleInitialize}
      onSubmit={handleOnSubmit}
      onError={onError}
      className={className}
      size={size}
      variant={variant}
      isInitialized={true}
    />
  );
};

export default SignUp;
