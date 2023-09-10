const TypeError = {
  PROBLEM_WITH_TOKEN: 'PROBLEM_WITH_TOKEN',
  BODY_NOT_VALID: 'BODY_NOT_VALID',
  PARAMS_NOT_VALID: 'PARAMS_NOT_VALID',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  UNDEFINED_ERROR: 'UNDEFINED_ERROR',
  USER_EXIST: 'USER_EXIST',
  LOGIN_ERROR: 'LOGIN_ERROR',
  NOT_FOUND: 'NOT_FOUND',
};

class CustomError {
  constructor(status = 500, response = TypeError.UNEXPECTED_ERROR) {
    this.status = status;
    if (TypeError.hasOwnProperty(response)) {
      this.response = { error: response };
    } else {
      this.response = response;
    }
  }
}
module.exports = { CustomError, TypeError };
