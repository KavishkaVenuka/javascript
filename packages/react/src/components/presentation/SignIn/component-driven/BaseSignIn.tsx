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

import {FC, useState, useCallback, ReactElement} from 'react';
import {cx} from '@emotion/css';
import {EmbeddedFlowComponent, withVendorCSSClassPrefix, EmbeddedSignInFlowRequestV2} from '@asgardeo/browser';
import useTranslation from '../../../../hooks/useTranslation';
import Card, {CardProps} from '../../../primitives/Card/Card';
import Spinner from '../../../primitives/Spinner/Spinner';
import Alert from '../../../primitives/Alert/Alert';
import Logo from '../../../primitives/Logo/Logo';
import Typography from '../../../primitives/Typography/Typography';
import useTheme from '../../../../contexts/Theme/useTheme';
import useStyles from '../BaseSignIn.styles';
import useFlow from '../../../../contexts/Flow/useFlow';
import FlowProvider from '../../../../contexts/Flow/FlowProvider';
import {FormField, useForm} from '../../../../hooks/useForm';
import {renderSignInComponents} from './SignInOptionFactory';

/**
 * Props for the BaseSignIn component.
 */
export interface BaseSignInProps {
  /**
   * Custom CSS class name for the submit button.
   */
  buttonClassName?: string;

  /**
   * Custom CSS class name for the form container.
   */
  className?: string;

  /**
   * Array of flow components to render.
   */
  components?: EmbeddedFlowComponent[];

  /**
   * Custom CSS class name for error messages.
   */
  errorClassName?: string;

  /**
   * Flag to determine if the component is ready to be rendered.
   */
  isLoading?: boolean;

  /**
   * Custom CSS class name for form inputs.
   */
  inputClassName?: string;

  /**
   * Custom CSS class name for info messages.
   */
  messageClassName?: string;

  /**
   * Callback function called when authentication fails.
   * @param error - The error that occurred during authentication.
   */
  onError?: (error: Error) => void;

  /**
   * Function to handle form submission.
   * @param payload - The form data to submit.
   * @param component - The component that triggered the submission.
   */
  onSubmit?: (payload: EmbeddedSignInFlowRequestV2, component: EmbeddedFlowComponent) => Promise<void>;

  /**
   * Callback function called when authentication is successful.
   * @param authData - The authentication data returned upon successful completion.
   */
  onSuccess?: (authData: Record<string, any>) => void;

  /**
   * Size variant for the component.
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Theme variant for the component.
   */
  variant?: CardProps['variant'];
}

/**
 * Base SignIn component that provides generic authentication flow.
 * This component handles component-driven UI rendering and can transform input
 * structure to component-driven format automatically.
 *
 * @example
 * ```tsx
 * import { BaseSignIn } from '@asgardeo/react';
 *
 * const MySignIn = () => {
 *   return (
 *     <BaseSignIn
 *       onInitialize={async (payload) => {
 *         // Your API call to initialize authentication
 *         return await initializeAuth(payload);
 *       }}
 *       onSubmit={async (payload) => {
 *         // Your API call to handle authentication
 *         return await handleAuth(payload);
 *       }}
 *       onSuccess={(authData) => {
 *         console.log('Success:', authData);
 *       }}
 *       onError={(error) => {
 *         console.error('Error:', error);
 *       }}
 *       className="max-w-md mx-auto"
 *     />
 *   );
 * };
 * ```
 */
const BaseSignIn: FC<BaseSignInProps> = props => {
  const {theme} = useTheme();
  const styles = useStyles(theme, theme.vars.colors.text.primary);

  return (
    <div>
      <div className={styles.logoContainer}>
        <Logo size="large" />
      </div>
      <FlowProvider>
        <BaseSignInContent {...props} />
      </FlowProvider>
    </div>
  );
};

/**
 * Internal component that consumes FlowContext and renders the sign-in UI.
 */
const BaseSignInContent: FC<BaseSignInProps> = ({
  components = [],
  onSubmit,
  onError,
  className = '',
  inputClassName = '',
  buttonClassName = '',
  errorClassName = '',
  messageClassName = '',
  size = 'medium',
  variant = 'outlined',
  isLoading: externalIsLoading,
}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {subtitle: flowSubtitle, title: flowTitle, messages: flowMessages} = useFlow();
  const styles = useStyles(theme, theme.vars.colors.text.primary);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{message: string; type: string}>>([]);

  const isLoading = externalIsLoading || isSubmitting;

  /**
   * Extract form fields from flow components
   */
  const extractFormFields = useCallback(
    (components: EmbeddedFlowComponent[]): FormField[] => {
      const fields: FormField[] = [];

      const processComponents = (comps: EmbeddedFlowComponent[]) => {
        comps.forEach(component => {
          if (component.type === 'INPUT' && component.config) {
            const identifier = component.config['identifier'] || component.id;
            fields.push({
              name: identifier,
              required: component.config['required'] || false,
              initialValue: '',
              validator: (value: string) => {
                if (component.config['required'] && (!value || value.trim() === '')) {
                  return t('field.required');
                }
                return null;
              },
            });
          }
          if (component.components) {
            processComponents(component.components);
          }
        });
      };

      processComponents(components);
      return fields;
    },
    [t],
  );

  const formFields = components ? extractFormFields(components) : [];

  const form = useForm<Record<string, string>>({
    initialValues: {},
    fields: formFields,
    validateOnBlur: true,
    validateOnChange: false,
    requiredMessage: t('field.required'),
  });

  const {
    values: formValues,
    touched: touchedFields,
    errors: formErrors,
    isValid: isFormValid,
    setValue: setFormValue,
    setTouched: setFormTouched,
    validateForm,
    touchAllFields,
    reset: resetForm,
  } = form;

  /**
   * Handle input value changes.
   */
  const handleInputChange = (name: string, value: string) => {
    setFormValue(name, value);
    setFormTouched(name, true);
  };

  /**
   * Handle component submission (for buttons and actions).
   */
  const handleSubmit = async (component: EmbeddedFlowComponent, data?: Record<string, any>) => {
    // Mark all fields as touched before validation
    touchAllFields();

    const validation = validateForm();
    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessages([]);

    try {
      // Filter out empty or undefined input values
      const filteredInputs: Record<string, any> = {};
      if (data) {
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
            filteredInputs[key] = data[key];
          }
        });
      }

      let payload: EmbeddedSignInFlowRequestV2 = {};

      if (component.config['actionId']) {
        payload = {
          ...payload,
          actionId: component.config['actionId'],
        };
      } else {
        payload = {
          ...payload,
          inputs: filteredInputs,
        };
      }

      await onSubmit?.(payload, component);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.sign.in.flow.failure');
      setError(errorMessage);
      onError?.(err as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate CSS classes
  const containerClasses = cx(
    [
      withVendorCSSClassPrefix('signin'),
      withVendorCSSClassPrefix(`signin--${size}`),
      withVendorCSSClassPrefix(`signin--${variant}`),
    ],
    className,
  );

  const inputClasses = cx(
    [
      withVendorCSSClassPrefix('signin__input'),
      size === 'small' && withVendorCSSClassPrefix('signin__input--small'),
      size === 'large' && withVendorCSSClassPrefix('signin__input--large'),
    ],
    inputClassName,
  );

  const buttonClasses = cx(
    [
      withVendorCSSClassPrefix('signin__button'),
      size === 'small' && withVendorCSSClassPrefix('signin__button--small'),
      size === 'large' && withVendorCSSClassPrefix('signin__button--large'),
    ],
    buttonClassName,
  );

  const errorClasses = cx([withVendorCSSClassPrefix('signin__error')], errorClassName);

  const messageClasses = cx([withVendorCSSClassPrefix('signin__messages')], messageClassName);

  /**
   * Render components based on flow data using the factory
   */
  const renderComponents = useCallback(
    (components: EmbeddedFlowComponent[]): ReactElement[] =>
      renderSignInComponents(
        components,
        formValues,
        touchedFields,
        formErrors,
        isLoading,
        isFormValid,
        handleInputChange,
        {
          buttonClassName: buttonClasses,
          error,
          inputClassName: inputClasses,
          onSubmit: handleSubmit,
          size,
          variant,
        },
      ),
    [
      formValues,
      touchedFields,
      formErrors,
      isFormValid,
      isLoading,
      size,
      variant,
      error,
      inputClasses,
      buttonClasses,
      handleSubmit,
    ],
  );

  if (isLoading) {
    return (
      <Card className={cx(containerClasses, styles.card)} variant={variant}>
        <Card.Content>
          <div style={{display: 'flex', justifyContent: 'center', padding: '2rem'}}>
            <Spinner />
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (!components || components.length === 0) {
    return (
      <Card className={cx(containerClasses, styles.card)} variant={variant}>
        <Card.Content>
          <Alert variant="warning">
            <Typography variant="body1">{t('errors.sign.in.components.not.available')}</Typography>
          </Alert>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className={cx(containerClasses, styles.card)} variant={variant}>
      <Card.Header className={styles.header}>
        <Card.Title level={2} className={styles.title}>
          {flowTitle || t('signin.title')}
        </Card.Title>
        <Typography variant="body1" className={styles.subtitle}>
          {flowSubtitle || t('signin.subtitle')}
        </Typography>
        {flowMessages && flowMessages.length > 0 && (
          <div className={styles.flowMessagesContainer}>
            {flowMessages.map((message, index) => (
              <Alert
                key={index}
                variant={message.type === 'error' ? 'error' : 'info'}
                className={cx(styles.flowMessageItem, messageClasses)}
              >
                <Alert.Description>{message.message}</Alert.Description>
              </Alert>
            ))}
          </div>
        )}
      </Card.Header>

      <Card.Content>
        {error && (
          <Alert variant="error" className={cx(styles.errorContainer, errorClasses)}>
            <Alert.Title>{t('errors.title')}</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert>
        )}

        <div className={styles.contentContainer}>{components && renderComponents(components)}</div>
      </Card.Content>
    </Card>
  );
};

export default BaseSignIn;
