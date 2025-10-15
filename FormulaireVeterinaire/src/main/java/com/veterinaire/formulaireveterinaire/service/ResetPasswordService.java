package com.veterinaire.formulaireveterinaire.service;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

public interface ResetPasswordService {
    ResponseEntity<String> resetPassword(Map<String, String> request, UserDetails userDetails);
}
