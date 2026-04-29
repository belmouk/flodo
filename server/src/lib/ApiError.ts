class ApiError extends Error {
  status: number;
  details: Record<string, any>;
  type: string;
  constructor(
    message: string,
    status: number,
    type: string,
    details: Record<string, any> = {},
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.type = type;
  }
}

export default ApiError;
