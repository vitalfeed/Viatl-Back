package com.veterinaire.formulaireveterinaire.controller;

import com.veterinaire.formulaireveterinaire.DTO.LoginDTO;
import com.veterinaire.formulaireveterinaire.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginDTO loginDTO, HttpServletResponse response) {
        Map<String, Object> responseBody = new HashMap<>();

        try {
            Map<String, Object> authResult = authService.login(loginDTO);

            String token = (String) authResult.get("token");
            boolean isAdmin = (boolean) authResult.get("isAdmin");

            // Create cookie for JWT
           ResponseCookie cookie = ResponseCookie.from("access_token", token)
                    .httpOnly(true)
                    .secure(true)  // ✅ MUST be true for SameSite=None
                    .path("/")
                    .maxAge(60 * 60 * 24 * 7)
                    .sameSite("None")
                    .build();


            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            responseBody.put("message", "Login successful");
            responseBody.put("isAdmin", isAdmin);
            return ResponseEntity.ok(responseBody);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Unauthorized: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }


    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        return authService.resetPassword(request, userDetails);
    }


}
