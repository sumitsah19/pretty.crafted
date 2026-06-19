package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Address;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AddressRepository extends JpaRepository<Address, Long> {

    // Default first, then newest — the order the account screen and checkout show.
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    Optional<Address> findFirstByUserIdAndIsDefaultTrue(Long userId);

    long countByUserId(Long userId);

    /**
     * Clears the default flag on every address of a user except {@code keepId}
     * (pass a non-existent id like 0 to clear all). Single statement so promoting
     * a new default can't transiently leave two defaults set.
     */
    @Modifying
    @Query("update Address a set a.isDefault = false where a.user.id = :userId and a.id <> :keepId and a.isDefault = true")
    void clearDefaultExcept(@Param("userId") Long userId, @Param("keepId") Long keepId);
}
