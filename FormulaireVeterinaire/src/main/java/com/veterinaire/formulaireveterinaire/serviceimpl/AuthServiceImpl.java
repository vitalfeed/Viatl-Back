package com.veterinaire.formulaireveterinaire.serviceimpl;

import com.veterinaire.formulaireveterinaire.Config.JwtUtil;
import com.veterinaire.formulaireveterinaire.DAO.UserRepository;
import com.veterinaire.formulaireveterinaire.DTO.LoginDTO;

import com.veterinaire.formulaireveterinaire.entity.User;
import com.veterinaire.formulaireveterinaire.service.AuthService;
import com.veterinaire.formulaireveterinaire.service.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final UserService userService;

    public AuthServiceImpl(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                           UserRepository userRepository, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    public Map<String, Object> login(LoginDTO loginDTO) {
        try {
            // Authenticate user with email and password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginDTO.email(), loginDTO.password())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Load user details
            User user = userService.findByEmail(loginDTO.email())
                    .orElseThrow(() -> new RuntimeException("User not found: " + loginDTO.email()));

            // For non-admin users (isAdmin = false), allow login regardless of status or subscription
            // Admins (isAdmin = true) can always log in
            // No checks for status or subscription expiration for non-admins

            // Generate JWT token
            String token = jwtUtil.generateToken(loginDTO.email(), user.isAdmin());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("mustResetPassword", user.isFirstLogin());
            response.put("isAdmin", user.isAdmin());

            // Update first login status if needed
            if (user.isFirstLogin()) {
                user.setFirstLogin(false);
                userRepository.save(user);
            }

            return response;
        } catch (AuthenticationException e) {
            throw new RuntimeException("Unauthorized: Bad credentials", e);
        }
    }
}
