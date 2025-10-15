package com.veterinaire.formulaireveterinaire.serviceimpl;

import com.veterinaire.formulaireveterinaire.Enums.SubscriptionStatus;

import com.veterinaire.formulaireveterinaire.DAO.OurVeterinaireRepository;
import com.veterinaire.formulaireveterinaire.DAO.UserRepository;
import com.veterinaire.formulaireveterinaire.entity.User;
import com.veterinaire.formulaireveterinaire.service.UserService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Random;

@Service
public class UserServiceImpl implements UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final OurVeterinaireRepository ourVeterinaireRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final String excelFilePath;


    public UserServiceImpl(UserRepository userRepository, OurVeterinaireRepository ourVeterinaireRepository ,PasswordEncoder passwordEncoder,
                           JavaMailSender mailSender, @Value("${excel.file.path}") String excelFilePath) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.ourVeterinaireRepository = ourVeterinaireRepository;
        this.mailSender = mailSender;
        this.excelFilePath = excelFilePath;
    }

    @Override
    public String registerUser(@Valid User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Un utilisateur avec cet email existe déjà");
        }
        if (!verifyMatricule(user.getNumMatricule())) {
            throw new RuntimeException("Matricule non disponible");
        }
        String generatedPassword = generateRandomPassword();
        user.setPassword(passwordEncoder.encode(generatedPassword));
        user.setStatus(SubscriptionStatus.INACTIVE);
        userRepository.save(user);
        sendWelcomeEmail(user.getEmail(), generatedPassword , user.getNom());
        return "Utilisateur enregistré avec succès. Vérifiez votre email.";
    }

    private boolean verifyMatricule(String numMatricule) {
        return ourVeterinaireRepository.findByMatricule(numMatricule).isPresent();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }



    private String generateRandomPassword() {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        Random random = new Random();
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            password.append(characters.charAt(random.nextInt(characters.length())));
        }
        return password.toString();
    }

    private void sendWelcomeEmail(String to, String password, String nom)
    {
        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("Bienvenue sur VITALFEED – Votre espace vétérinaire est prêt");

            String webPortalLink = "https://vitalfeed.tn/espace-veterinaire";
            String appDownloadLink = "https://vitalfeed.tn/telechargement";

            String htmlContent = """
                <html>
                <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#333;">
                    <table align="center" width="100%%" cellpadding="0" cellspacing="0" style="max-width:650px; margin:auto; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color:#00897B; padding:25px 40px; text-align:center;">
                                <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:0.5px;">VITALFEED</h1>
                                <p style="color:#dff9f3; margin:5px 0 0; font-size:14px;">Simplifiez et modernisez votre pratique vétérinaire dès aujourd’hui</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <h2 style="color:#2c3e50;">Bienvenue sur VITALFEED 🩺</h2>
                                <p style="font-size:15px; line-height:1.6;">
                                    Bonjour Dr <strong>%s</strong>,<br><br>
                                    Nous sommes ravis de vous accueillir sur <strong>VITALFEED</strong>, votre nouvel espace digital conçu spécialement pour les vétérinaires.
                                    Cet espace vous permet de gérer facilement vos consultations pour chiens et chats, tout en simplifiant votre quotidien professionnel.
                                </p>

                                <!-- Account Info -->
                                <div style="margin-top:25px;">
                                    <h3 style="color:#00897B; font-size:17px; border-bottom:2px solid #eaf0f6; padding-bottom:6px;">Vos identifiants de connexion</h3>
                                    <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top:10px; border-collapse:collapse; font-size:14px;">
                                        <tr>
                                            <td style="padding:8px; color:#555;">Adresse e-mail :</td>
                                            <td style="padding:8px; text-align:right; font-weight:600;">%s</td>
                                        </tr>
                                        <tr style="background-color:#f9fbfd;">
                                            <td style="padding:8px; color:#555;">Mot de passe temporaire :</td>
                                            <td style="padding:8px; text-align:right; font-weight:600;">%s</td>
                                        </tr>
                                    </table>
                                    <p style="margin-top:10px; font-size:13px; color:#777;">⚠️ Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.</p>
                                </div>

                                <!-- Links Section -->\s
                                                         <div style="margin-top:30px;">
                                                             <h3 style="color:#00897B; font-size:17px;">Prochaines étapes :</h3>
                                                             <ol style="font-size:15px; line-height:1.8; padding-left:20px;">
                                                                 <li>
                                                                     - Vous pouvez accéder à votre Espace Vétérinaire <strong>Espace Vétérinaire</strong> \s
                                                                     <a href="%s" style="color:#00897B; text-decoration:none; font-weight:600;">Connexion</a>.
                                                                 </li>
                                                                 <li>
                                                                     - Choisissez le type d’abonnement de votre choix directement depuis votre espace web.
                                                                 </li>
                                                                 <li>
                                                                     - Si vous avez déjà un abonnement actif et valide, vous pouvez télécharger l’application <strong>VITALFEED</strong>\s
                                                                     et vous connecter avec les mêmes identifiants (adresse e-mail et mot de passe).
                                                                 </li>
                                                             </ol>
                    
                                                             <p style="margin-top:20px; text-align:center;">
                                                                 <a href="%s" style="color:#ffffff; background-color:#00897B; padding:12px 25px; border-radius:6px; text-decoration:none; font-weight:600; display:inline-block;">
                                                                     Télécharger l’application VITALFEED
                                                                 </a>
                                                             </p>
                                                         </div>
                    

                                <div style="margin-top:35px;">
                                    <p style="font-size:15px;">Nous vous remercions de votre confiance et sommes impatients de vous accompagner dans vos consultations.</p>
                                    <p style="margin-top:20px; font-weight:600;">Bien cordialement,</p>
                                    <p style="margin-top:5px; color:#00897B; font-weight:700;">L’équipe VITALFEED</p>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color:#f0f3f7; padding:15px 30px; text-align:center; font-size:12px; color:#777;">
                                Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre directement.<br>
                                © %s VITALFEED – Tous droits réservés.
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                    nom,                // 👈 Personalized name from formulaire
                    to,
                    password,
                    webPortalLink,      // 👈 Clickable in text (Espace Vétérinaire)
                    appDownloadLink,    // 👈 Main button (Download app)
                    String.valueOf(LocalDate.now().getYear())
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

            logger.info("Professional welcome email sent to {}", to);
        } catch (MessagingException e) {
            logger.error("Failed to send welcome email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'e-mail de bienvenue", e);
        }
    }


}