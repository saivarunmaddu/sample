package spring.ecommerce.project.exception;

public class ApiException extends RuntimeException {
    public ApiException(String message) {
        super(message);
    }
}

