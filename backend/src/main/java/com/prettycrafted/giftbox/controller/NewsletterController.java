package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.domain.NewsletterSubscriber;
import com.prettycrafted.giftbox.dto.NewsletterSubscribeRequest;
import com.prettycrafted.giftbox.repository.NewsletterSubscriberRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Backs the homepage newsletter form. Public (Chain 1 via /api/public/**) and
 * rate-limited per IP (see WebConfig) so it can't be scripted into a write flood.
 * Idempotent: re-subscribing an existing address succeeds quietly rather than
 * leaking whether an email is already on the list.
 */
@Slf4j
@RestController
@RequestMapping("/api/public/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterSubscriberRepository repo;

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@Valid @RequestBody NewsletterSubscribeRequest req) {
        String email = req.email().trim().toLowerCase();
        if (repo.existsByEmail(email)) {
            return;
        }
        try {
            repo.save(NewsletterSubscriber.builder().email(email).build());
        } catch (DataIntegrityViolationException raceLost) {
            // Concurrent duplicate subscription — the address is on the list either way.
            log.debug("Newsletter subscribe race for an existing address — ignoring");
        }
    }
}
