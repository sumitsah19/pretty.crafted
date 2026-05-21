package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.EmailVerificationToken;
import com.prettycrafted.giftbox.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    void deleteByUser(User user);
}
