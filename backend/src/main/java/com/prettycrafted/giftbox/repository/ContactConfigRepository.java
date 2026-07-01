package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.ContactConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactConfigRepository extends JpaRepository<ContactConfig, Long> {
}
