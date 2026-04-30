class ApiError extends Error {
  status: number;
  details: Record<string, any>;
  code: string;
  constructor(
    message: string,
    status: number,
    type: string,
    details: Record<string, any> = {},
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = type;
  }
}

export default ApiError;
