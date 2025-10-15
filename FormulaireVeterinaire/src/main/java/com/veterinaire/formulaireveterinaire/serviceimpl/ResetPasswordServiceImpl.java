package com.veterinaire.formulaireveterinaire.serviceimpl;

import com.veterinaire.formulaireveterinaire.DAO.UserRepository;
import com.veterinaire.formulaireveterinaire.entity.User;
import com.veterinaire.formulaireveterinaire.service.ResetPasswordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ResetPasswordServiceImpl implements ResetPasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ResetPasswordServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public ResponseEntity<String> resetPassword(Map<String, String> request, UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Invalid or missing authentication\"}");
        }

        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"User not found\"}");
        }

        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("{\"error\": \"New password is required\"}");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok("{\"message\": \"Mot de passe réinitialisé avec succès\"}");
    }
}
