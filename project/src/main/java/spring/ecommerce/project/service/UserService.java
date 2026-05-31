package spring.ecommerce.project.service;

import org.springframework.stereotype.Service;
import spring.ecommerce.project.dto.*;
import spring.ecommerce.project.exception.ApiException;
import spring.ecommerce.project.model.Role;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuthService authService;

    public UserService(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    public AuthResponse register(RegisterRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(u -> {
            throw new ApiException("Email already exists");
        });

        UserEntity user = new UserEntity();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(request.password());
        user.setPhone(request.phone());
        user.setAddress(request.address());
        user.setRole(Role.USER);

        UserEntity saved = userRepository.save(user);
        String token = authService.createToken(saved);

        return new AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), token);
    }

    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException("Invalid email or password"));

        if (!user.getPassword().equals(request.password())) {
            throw new ApiException("Invalid email or password");
        }

        String token = authService.createToken(user);
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), token);
    }

    public ProfileResponse getProfile(UserEntity user) {
        return toProfileResponse(user);
    }

    public ProfileResponse updateProfile(UserEntity user, UpdateProfileRequest request) {
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.address() != null) {
            user.setAddress(request.address());
        }

        UserEntity updated = userRepository.save(user);
        return toProfileResponse(updated);
    }

    private ProfileResponse toProfileResponse(UserEntity user) {
        return new ProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getRole()
        );
    }
}

