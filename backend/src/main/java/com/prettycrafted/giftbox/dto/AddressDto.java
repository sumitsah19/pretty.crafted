package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Address;

public record AddressDto(
    Long id,
    String label,
    String recipientName,
    String phone,
    String line1,
    String line2,
    String city,
    String state,
    String zip,
    String country,
    boolean isDefault
) {
    public static AddressDto from(Address a) {
        return new AddressDto(
            a.getId(), a.getLabel(), a.getRecipientName(), a.getPhone(),
            a.getLine1(), a.getLine2(), a.getCity(), a.getState(),
            a.getZip(), a.getCountry(), a.isDefault());
    }
}
