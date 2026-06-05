package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Coupon;
import com.prettycrafted.giftbox.dto.CouponDto;
import com.prettycrafted.giftbox.dto.CouponRequest;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CouponRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponService {
    private final CouponRepository repo;

    @Transactional(readOnly = true)
    public List<CouponDto> listAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(CouponDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CouponDto> listActive() {
        return repo.findByActiveTrueOrderByCreatedAtDesc().stream().map(CouponDto::from).toList();
    }

    public CouponDto create(CouponRequest req) {
        String code = req.code().trim().toUpperCase();
        if (repo.existsByCode(code)) {
            throw new ConflictException("Coupon code already exists: " + code);
        }
        Coupon coupon = Coupon.builder()
            .code(code)
            .discountPercent(req.discountPercent())
            .expiresOn(req.expires() == null || req.expires().isBlank() ? "No expiry" : req.expires().trim())
            .active(true)
            .uses(0)
            .build();
        return CouponDto.from(repo.save(coupon));
    }

    public CouponDto toggle(Long id) {
        Coupon coupon = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Coupon not found: " + id));
        coupon.setActive(!coupon.isActive());
        return CouponDto.from(coupon);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Coupon not found: " + id);
        }
        repo.deleteById(id);
    }
}
