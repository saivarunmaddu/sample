package spring.ecommerce.project.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import spring.ecommerce.project.dto.*;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.service.AuthService;
import spring.ecommerce.project.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @GetMapping("/profile")
    public ProfileResponse getProfile(@RequestHeader("Authorization") String authorization) {
        UserEntity user = authService.requireUser(authorization);
        return userService.getProfile(user);
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(
            @RequestHeader("Authorization") String authorization,
            @RequestBody UpdateProfileRequest request
    ) {
        UserEntity user = authService.requireUser(authorization);
        return userService.updateProfile(user, request);
    }
}

