package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.ContactConfig;
import com.prettycrafted.giftbox.dto.ContactConfigDto;
import com.prettycrafted.giftbox.repository.ContactConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ContactConfigService {

    private static final String DEFAULT_EMAIL = "support@prettycrafted.com";
    private static final String DEFAULT_HOURS = "Mon–Sat, 10am–6pm IST";

    private final ContactConfigRepository repo;

    @Transactional(readOnly = true)
    public ContactConfigDto get() {
        ContactConfig cfg = repo.findAll().stream().findFirst().orElse(null);
        if (cfg == null) {
            // Sensible defaults until an admin configures the channels.
            ContactConfigDto dto = new ContactConfigDto();
            dto.setSupportEmail(DEFAULT_EMAIL);
            dto.setHours(DEFAULT_HOURS);
            dto.setEmailEnabled(true);
            dto.setWhatsappEnabled(false);
            dto.setPhoneEnabled(false);
            return dto;
        }
        return toDto(cfg);
    }

    public ContactConfigDto update(ContactConfigDto req) {
        ContactConfig cfg = repo.findAll().stream().findFirst().orElseGet(ContactConfig::new);
        cfg.setSupportEmail(trimToNull(req.getSupportEmail()));
        cfg.setWhatsappNumber(digitsOrNull(req.getWhatsappNumber()));
        cfg.setPhoneNumber(trimToNull(req.getPhoneNumber()));
        cfg.setHours(trimToNull(req.getHours()));
        cfg.setEmailEnabled(Boolean.TRUE.equals(req.getEmailEnabled()));
        cfg.setWhatsappEnabled(Boolean.TRUE.equals(req.getWhatsappEnabled()));
        cfg.setPhoneEnabled(Boolean.TRUE.equals(req.getPhoneEnabled()));
        return toDto(repo.save(cfg));
    }

    private static ContactConfigDto toDto(ContactConfig cfg) {
        ContactConfigDto dto = new ContactConfigDto();
        dto.setId(cfg.getId());
        dto.setSupportEmail(cfg.getSupportEmail());
        dto.setWhatsappNumber(cfg.getWhatsappNumber());
        dto.setPhoneNumber(cfg.getPhoneNumber());
        dto.setHours(cfg.getHours());
        dto.setEmailEnabled(cfg.getEmailEnabled());
        dto.setWhatsappEnabled(cfg.getWhatsappEnabled());
        dto.setPhoneEnabled(cfg.getPhoneEnabled());
        return dto;
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** Keep only digits so it slots straight into a wa.me/<number> link. */
    private static String digitsOrNull(String s) {
        if (s == null) return null;
        String digits = s.replaceAll("\\D", "");
        return digits.isEmpty() ? null : digits;
    }
}
