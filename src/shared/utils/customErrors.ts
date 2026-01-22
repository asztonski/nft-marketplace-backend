class AccountAlreadyActivatedError extends Error {
  public statusCode: number;

  constructor(message = "Account is already activated") {
    super(message);
    this.name = "AccountAlreadyActivatedError";
    this.statusCode = 400;
  }
}

class InvalidTokenError extends Error {
  public statusCode: number;

  constructor(message = "Activation token is invalid or expired") {
    super(message);
    this.name = "InvalidTokenError";
    this.statusCode = 400;
  }
}

export { AccountAlreadyActivatedError, InvalidTokenError };
