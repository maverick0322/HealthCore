import { AxiosError } from 'axios';

interface LogMetadata {
  [key: string]: unknown;
}

const formatAxiosError = (error: unknown): LogMetadata => {
  if (error instanceof AxiosError) {
    return {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      responseData: error.response?.data,
      method: error.config?.method,
      url: error.config?.url,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: error };
};

export const logClientInfo = (context: string, metadata?: LogMetadata) => {
  console.info(`[HealthCore][${context}]`, metadata ?? {});
};

export const logClientWarn = (context: string, metadata?: LogMetadata) => {
  console.warn(`[HealthCore][${context}]`, metadata ?? {});
};

export const logClientError = (context: string, error: unknown, metadata?: LogMetadata) => {
  console.groupCollapsed(`[HealthCore][${context}]`);
  console.error('metadata', metadata ?? {});
  console.error('error', formatAxiosError(error));
  console.groupEnd();
};
