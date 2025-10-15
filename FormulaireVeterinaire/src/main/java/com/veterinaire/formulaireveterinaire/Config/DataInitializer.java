package com.veterinaire.formulaireveterinaire.Config;

import com.veterinaire.formulaireveterinaire.Enums.SubscriptionStatus;
import com.veterinaire.formulaireveterinaire.DAO.UserRepository;
import com.veterinaire.formulaireveterinaire.entity.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {

    private final UserRepository userRepository;

    public DataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    CommandLineRunner initAdmin() {
        return args -> {
            if (!userRepository.existsByEmail("admin@example.com")) {
                User admin = new User();
                admin.setNom("Admin");
                admin.setPrenom("User");
                admin.setEmail("admin@example.com");
                admin.setNumMatricule("ADMIN123");
                admin.setAdresseCabinet("Admin Office");
                admin.setPassword("$2a$12$Gc3wvZUBgr5AYKpU2Y7.teXzKKvoAu04LzpDecze8iNQCkhcANy5a"); // mot de passe déjà hashé
                admin.setAdmin(true);

                admin.setStatus(SubscriptionStatus.ACTIVE);
                userRepository.save(admin);
            }
        };
    }
}


