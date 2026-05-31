package spring.ecommerce.project.service;

import org.springframework.stereotype.Service;
import spring.ecommerce.project.exception.ApiException;
import spring.ecommerce.project.model.Role;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.repository.UserRepository;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final Map<String, Long> tokens = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String createToken(UserEntity user) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, user.getId());
        return token;
    }

    public UserEntity requireUser(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ApiException("Missing or invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        Long userId = tokens.get(token);
        if (userId == null) {
            throw new ApiException("Invalid or expired token");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found"));
    }

    public void requireAdmin(UserEntity user) {
        if (user.getRole() != Role.ADMIN) {
            throw new ApiException("Only admin can perform this action");
        }
    }
}

