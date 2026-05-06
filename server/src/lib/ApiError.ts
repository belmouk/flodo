class ApiError extends Error {
  status: number;
  details: Record<string, any>;
  code: string;
  constructor(
    message: string,
    status: number,
    code: string,
    details: Record<string, any> = {},
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export default ApiError;
