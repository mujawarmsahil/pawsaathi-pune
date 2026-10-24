export type ApiFieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: ApiFieldError[];

  constructor(
    status: number,
    message: string,
    code = 'REQUEST_FAILED',
    fieldErrors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export type ApiErrorBody = {
  message?: string;
  errorCode?: string;
  code?: string;
  fieldErrors?: ApiFieldError[];
};
