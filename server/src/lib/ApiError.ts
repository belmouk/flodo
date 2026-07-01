class ApiError extends Error {
  status: number;
  details: Record<string, string[] | undefined>;
  code: string;
  constructor(
    message: string,
    status: number,
    code: string,
    details: Record<string, string[] | undefined> = {},
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export default ApiError;
