package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.User;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Phone is not DB-unique (legacy email/password accounts may share or lack a
    // number), so resolve OTP logins deterministically to the oldest match.
    Optional<User> findFirstByPhoneOrderByIdAsc(String phone);

    @Query("SELECT u FROM User u WHERE u.role = 'USER' AND " +
           "(:q IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%',:q,'%'))) " +
           "ORDER BY u.createdAt DESC")
    Page<User> searchCustomers(@Param("q") String q, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'USER'")
    long countCustomers();
}
