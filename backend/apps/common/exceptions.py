"""
Centralized API error handling foundation for LogiFlows DRF endpoints.
Ensures standard structured error envelopes for client applications.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('apps.common')


def custom_exception_handler(exc, context):
    """
    Standardizes error responses to envelope format:
    {
        "status": "error",
        "error_code": "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR",
        "message": "Human readable message",
        "details": {...}
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_code = "API_ERROR"
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            error_code = "VALIDATION_ERROR"
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = "AUTHENTICATION_REQUIRED"
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            error_code = "PERMISSION_DENIED"
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            error_code = "NOT_FOUND"
        elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            error_code = "METHOD_NOT_ALLOWED"

        custom_data = {
            "status": "error",
            "error_code": error_code,
            "message": "Request could not be processed",
            "details": response.data,
        }
        response.data = custom_data
        return response

    # Unhandled exceptions
    logger.exception(f"Unhandled exception encountered in API: {exc}", exc_info=exc)
    return Response(
        {
            "status": "error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected server error occurred.",
            "details": str(exc) if context.get('request') and context['request'].GET.get('debug') else None,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
