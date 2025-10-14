package com.veterinaire.formulaireveterinaire.service;

import com.veterinaire.formulaireveterinaire.DTO.LoginDTO;

import java.util.Map;

public interface AuthService {
    Map<String, Object> login(LoginDTO loginDTO);
}
