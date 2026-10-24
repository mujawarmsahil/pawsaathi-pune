package in.pawsaathi.pune.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> invalid(
            MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<ApiErrorResponse.FieldError> errors =
                exception.getBindingResult().getFieldErrors().stream()
                        .map(
                                error ->
                                        new ApiErrorResponse.FieldError(
                                                error.getField(), error.getDefaultMessage()))
                        .toList();
        return error(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Please check the information entered.",
                request,
                errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> constraintViolation(
            ConstraintViolationException exception, HttpServletRequest request) {
        List<ApiErrorResponse.FieldError> errors =
                exception.getConstraintViolations().stream()
                        .map(
                                violation ->
                                        new ApiErrorResponse.FieldError(
                                                violation.getPropertyPath().toString(),
                                                violation.getMessage()))
                        .toList();
        return error(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Please check the information entered.",
                request,
                errors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> malformed(
            HttpMessageNotReadableException exception, HttpServletRequest request) {
        return error(
                HttpStatus.BAD_REQUEST,
                "MALFORMED_REQUEST",
                "Request body is invalid.",
                request,
                List.of());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> badRequest(
            BadRequestException exception, HttpServletRequest request) {
        return error(
                HttpStatus.BAD_REQUEST,
                "REQUEST_REJECTED",
                exception.getMessage(),
                request,
                List.of());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorResponse> unauthorized(
            UnauthorizedException exception, HttpServletRequest request) {
        return error(
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                exception.getMessage(),
                request,
                List.of());
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiErrorResponse> notFound(
            NotFoundException exception, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> missingEndpoint(
            NoResourceFoundException exception, HttpServletRequest request) {
        return error(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                "The requested endpoint was not found.",
                request,
                List.of());
    }

    @ExceptionHandler({
        ConflictException.class,
        InvalidStateTransitionException.class,
        OptimisticLockingFailureException.class
    })
    public ResponseEntity<ApiErrorResponse> conflict(
            RuntimeException exception, HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "CONFLICT", exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> dataConflict(
            DataIntegrityViolationException exception, HttpServletRequest request) {
        log.warn("Data integrity conflict", exception);
        return error(
                HttpStatus.CONFLICT,
                "CONFLICT",
                "The request conflicts with existing data.",
                request,
                List.of());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiErrorResponse> forbidden(
            ForbiddenException exception, HttpServletRequest request) {
        return error(
                HttpStatus.FORBIDDEN, "FORBIDDEN", exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> accessDenied(
            AccessDeniedException exception, HttpServletRequest request) {
        return error(
                HttpStatus.FORBIDDEN,
                "FORBIDDEN",
                "This action is not available to your account.",
                request,
                List.of());
    }

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<ApiErrorResponse> payment(
            PaymentException exception, HttpServletRequest request) {
        return error(
                exception.getStatus(), "PAYMENT_ERROR", exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> expected(
            ResponseStatusException exception, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String code = status.is4xxClientError() ? "REQUEST_REJECTED" : "SERVICE_ERROR";
        String message =
                exception.getReason() == null
                        ? "The request could not be completed."
                        : exception.getReason();
        return error(status, code, message, request, List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> unexpected(
            Exception exception, HttpServletRequest request) {
        log.error("Unhandled API error", exception);
        return error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "Something went wrong. Please try again.",
                request,
                List.of());
    }

    private ResponseEntity<ApiErrorResponse> error(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            List<ApiErrorResponse.FieldError> errors) {
        return ResponseEntity.status(status)
                .body(
                        new ApiErrorResponse(
                                Instant.now(),
                                status.value(),
                                code,
                                message,
                                request.getRequestURI(),
                                errors));
    }
}
