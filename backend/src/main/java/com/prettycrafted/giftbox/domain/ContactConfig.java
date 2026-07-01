package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * Singleton holding the customer-support contact channels surfaced by the Help
 * Center "Contact Us" action. Admin-editable; each channel can be toggled on/off
 * independently so only configured channels appear on the storefront.
 */
@Entity
@Table(name = "contact_config")
@Data
public class ContactConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "support_email", length = 160)
    private String supportEmail;

    /** Digits only (e.g. 919876543210) — used to build a wa.me link. */
    @Column(name = "whatsapp_number", length = 24)
    private String whatsappNumber;

    @Column(name = "phone_number", length = 24)
    private String phoneNumber;

    /** Free-text availability, e.g. "Mon–Sat, 10am–6pm IST". */
    @Column(length = 160)
    private String hours;

    @Column(name = "email_enabled")
    private Boolean emailEnabled = true;

    @Column(name = "whatsapp_enabled")
    private Boolean whatsappEnabled = false;

    @Column(name = "phone_enabled")
    private Boolean phoneEnabled = false;
}
