package com.veterinaire.formulaireveterinaire.Config;

import com.veterinaire.formulaireveterinaire.Enums.SubscriptionStatus;
import com.veterinaire.formulaireveterinaire.DAO.SubscriptionRepository;
import com.veterinaire.formulaireveterinaire.DAO.UserRepository;
import com.veterinaire.formulaireveterinaire.entity.Subscription;
import com.veterinaire.formulaireveterinaire.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    private static final List<String> PERMIT_ALL_ENDPOINTS = Arrays.asList(
            "/api/login", "/api/users/register", "/api/demandes"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        logger.debug("Processing request for URI: {}", requestURI);
        logger.debug("Request method: {}", request.getMethod());

        // Use startsWith to support flexible paths like query params or trailing slashes
        boolean isPermitAll = PERMIT_ALL_ENDPOINTS.stream().anyMatch(requestURI::startsWith);
        if (isPermitAll) {
            logger.debug("Skipping authentication for permitAll endpoint: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        String token = null;
        String email = null;

        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            try {
                email = jwtUtil.extractEmail(token);
            } catch (Exception e) {
                logger.error("Failed to extract email from token: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Invalid token format\"}");
                return;
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            final String finalEmail = email;
            UserDetails userDetails = userDetailsService.loadUserByUsername(finalEmail);

            if (userDetails != null && jwtUtil.validateToken(token, finalEmail)) {
                User user = userRepository.findByEmail(finalEmail)
                        .orElseThrow(() -> new RuntimeException("User not found: " + finalEmail));

                if (!user.isAdmin() && user.getStatus() == SubscriptionStatus.ACTIVE) {
                    Subscription subscription = subscriptionRepository.findByUserEmail(finalEmail)
                            .orElseThrow(() -> new RuntimeException("No subscription found for user: " + finalEmail));
                    if (subscription.getEndDate().isBefore(LocalDateTime.now())) {
                        logger.warn("Subscription expired for user: {}", finalEmail);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Subscription expired\"}");
                        return;
                    }
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("Authenticated user: {}", finalEmail);
            } else {
                logger.warn("Invalid token or user details for email: {}", finalEmail);
            }
        } else {
            logger.debug("No token or authentication present for URI: {}", requestURI);
        }

        filterChain.doFilter(request, response);
    }
}