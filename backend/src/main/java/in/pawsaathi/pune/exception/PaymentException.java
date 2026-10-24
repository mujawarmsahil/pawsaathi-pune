package in.pawsaathi.pune.exception;

import org.springframework.http.HttpStatus;

public class PaymentException extends RuntimeException {
    private final HttpStatus status;

    public PaymentException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public PaymentException(String message, Throwable cause) {
        this(message, cause, HttpStatus.BAD_GATEWAY);
    }

    public PaymentException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public PaymentException(String message, Throwable cause, HttpStatus status) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
