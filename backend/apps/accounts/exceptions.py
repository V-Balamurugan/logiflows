from rest_framework.exceptions import APIException
from rest_framework import status


class InvalidCredentialsException(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = 'INVALID_CREDENTIALS'
    default_detail = 'Invalid email or password.'


class AccountInactiveException(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'ACCOUNT_INACTIVE'
    default_detail = 'This account is inactive. Please activate your account via the email link.'


class AccountLockedOutException(APIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_code = 'THROTTLED'
    default_detail = 'Account is temporarily locked due to excessive failed attempts. Please try again later.'


class TokenInvalidOrExpiredException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'TOKEN_EXPIRED'
    default_detail = 'The token provided is invalid or has expired.'
