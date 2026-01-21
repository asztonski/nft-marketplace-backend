class AccountAlreadyActivatedError extends Error {
  constructor(message = "Account is already activated") {
    super(message);
    this.name = "AccountAlreadyActivatedError";
    this.statusCode = 400;
  }
}

class InvalidTokenError extends Error {
  constructor(message = "Activation token is invalid or expired") {
    super(message);
    this.name = "InvalidTokenError";
    this.statusCode = 400;
  }
}

module.exports = {
  AccountAlreadyActivatedError,
  InvalidTokenError,
};