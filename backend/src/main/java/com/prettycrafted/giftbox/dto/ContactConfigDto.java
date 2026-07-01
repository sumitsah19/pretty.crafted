package com.prettycrafted.giftbox.dto;

import lombok.Data;

@Data
public class ContactConfigDto {
    private Long id;
    private String supportEmail;
    private String whatsappNumber;
    private String phoneNumber;
    private String hours;
    private Boolean emailEnabled;
    private Boolean whatsappEnabled;
    private Boolean phoneEnabled;
}
