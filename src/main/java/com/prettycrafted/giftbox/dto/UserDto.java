package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;

public record UserDto(Long id, String email, String name, String phone, Role role) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getName(), u.getPhone(), u.getRole());
    }
}
