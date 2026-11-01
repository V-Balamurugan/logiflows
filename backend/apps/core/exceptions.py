import logging
from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger('apps.core')


def custom_exception_handler(exc, context):
    """
    Standard exception handler for LogiFlows API.
    Wraps all DRF error responses in a consistent envelope:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable summary message",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is None:
        view_name = context.get('view').__class__.__name__ if context and context.get('view') else 'UnknownView'
        logger.exception(f'Unhandled server exception in {view_name}: {exc}')
        return Response(
            {
                'error': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'message': 'An unexpected error occurred on the server.',
                    'details': str(exc) if hasattr(exc, '__str__') else 'Internal Error',
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Determine structured error code from HTTP status code or custom uppercase exception code
    code_map = {
        status.HTTP_400_BAD_REQUEST: 'VALIDATION_ERROR',
        status.HTTP_401_UNAUTHORIZED: 'AUTHENTICATION_REQUIRED',
        status.HTTP_403_FORBIDDEN: 'PERMISSION_DENIED',
        status.HTTP_404_NOT_FOUND: 'NOT_FOUND',
        status.HTTP_405_METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
        status.HTTP_429_TOO_MANY_REQUESTS: 'THROTTLED',
        status.HTTP_503_SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    }
    custom_code = getattr(exc, 'default_code', None) or getattr(exc, 'code', None)
    if custom_code and isinstance(custom_code, str) and custom_code.isupper():
        error_code = custom_code
    else:
        error_code = code_map.get(response.status_code, 'API_ERROR')

    message = 'Request processing failed.'
    details = response.data

    if isinstance(response.data, dict):
        if 'detail' in response.data:
            message = str(response.data['detail'])
            details = response.data.get('details', response.data['detail'])
        elif 'error' in response.data and isinstance(response.data['error'], dict):
            return response
    elif isinstance(response.data, list):
        message = 'Validation errors occurred.'
        details = response.data

    response.data = {
        'error': {
            'code': error_code,
            'message': message,
            'details': details,
        }
    }

    return response
