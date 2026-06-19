package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Address;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.AddressDto;
import com.prettycrafted.giftbox.dto.AddressRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.AddressRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AddressService {
    private final AddressRepository repo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public List<AddressDto> list(Long userId) {
        return repo.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream().map(AddressDto::from).toList();
    }

    public AddressDto create(Long userId, AddressRequest req) {
        User user = userRepo.getReferenceById(userId);
        // The first address a user saves is always their default; after that the
        // client decides.
        boolean makeDefault = req.isDefault() || repo.countByUserId(userId) == 0;

        Address address = Address.builder()
                .user(user)
                .label(trimToNull(req.label()))
                .recipientName(req.recipientName().trim())
                .phone(req.phone().trim())
                .line1(req.line1().trim())
                .line2(trimToNull(req.line2()))
                .city(req.city().trim())
                .state(trimToNull(req.state()))
                .zip(req.zip().trim())
                .country(req.country() == null || req.country().isBlank() ? "India" : req.country().trim())
                .isDefault(makeDefault)
                .build();
        address = repo.save(address);

        if (makeDefault) {
            repo.clearDefaultExcept(userId, address.getId());
        }
        return AddressDto.from(address);
    }

    public AddressDto update(Long userId, Long id, AddressRequest req) {
        Address address = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Address not found: " + id));

        address.setLabel(trimToNull(req.label()));
        address.setRecipientName(req.recipientName().trim());
        address.setPhone(req.phone().trim());
        address.setLine1(req.line1().trim());
        address.setLine2(trimToNull(req.line2()));
        address.setCity(req.city().trim());
        address.setState(trimToNull(req.state()));
        address.setZip(req.zip().trim());
        address.setCountry(req.country() == null || req.country().isBlank() ? "India" : req.country().trim());

        // Promoting to default clears the flag on the others. We never turn the
        // last default off via an edit — switch defaults by setting another one.
        if (req.isDefault() && !address.isDefault()) {
            address.setDefault(true);
            repo.clearDefaultExcept(userId, id);
        }
        return AddressDto.from(address);
    }

    public AddressDto setDefault(Long userId, Long id) {
        Address address = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Address not found: " + id));
        address.setDefault(true);
        repo.clearDefaultExcept(userId, id);
        return AddressDto.from(address);
    }

    public void delete(Long userId, Long id) {
        Address address = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Address not found: " + id));
        boolean wasDefault = address.isDefault();
        repo.delete(address);

        // Never leave a user with addresses but no default — promote the newest
        // remaining one so checkout still has something to prefill.
        if (wasDefault) {
            repo.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).stream()
                    .findFirst()
                    .ifPresent(next -> next.setDefault(true));
        }
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
