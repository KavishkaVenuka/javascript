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

import {FC} from 'react';

import {BaseSignUpOptionProps} from '../presentation/SignUp/SignUpOptionFactory';
import Button from '../primitives/Button/Button';

/**
 * Social button component for sign-up forms.
 */
const SocialButton: FC<BaseSignUpOptionProps> = ({
  component,
  isLoading,
  buttonClassName,
  size = 'medium',
  onSubmit,
}) => {
  const config: Record<string, unknown> = component.config || {};
  const buttonText: string = (config['text'] as string) || (config['label'] as string) || 'Continue with Social';

  const handleClick = (): void => {
    if (onSubmit) {
      onSubmit(component, {});
    }
  };

  return (
    <Button
      key={component.id}
      type="button"
      variant="outline"
      size={size}
      disabled={isLoading}
      onClick={handleClick}
      className={buttonClassName}
      style={{width: '100%'}}
      startIcon={
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
        </svg>
      }
    >
      {buttonText}
    </Button>
  );
};

export default SocialButton;
