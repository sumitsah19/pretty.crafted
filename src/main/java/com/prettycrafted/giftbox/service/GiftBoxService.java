package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.BoxSize;
import com.prettycrafted.giftbox.domain.GiftBox;
import com.prettycrafted.giftbox.domain.GiftBoxItem;
import com.prettycrafted.giftbox.domain.GiftBoxStatus;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.domain.WrapType;
import com.prettycrafted.giftbox.dto.CreateGiftBoxRequest;
import com.prettycrafted.giftbox.dto.GiftBoxDto;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.GiftBoxRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class GiftBoxService {
    private final GiftBoxRepository giftBoxRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;

    public GiftBoxDto create(Long userId, CreateGiftBoxRequest req) {
        BoxSize size = req.size();
        WrapType wrap = req.wrapType();

        if (req.productIds().isEmpty()) {
            throw new BadRequestException("Box must contain at least one item");
        }
        if (req.productIds().size() > size.capacity()) {
            throw new BadRequestException(
                "Box capacity exceeded: " + size.name() + " holds up to " + size.capacity() + " items"
            );
        }

        User user = userRepo.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        List<Product> products = productRepo.findAllById(req.productIds());
        if (products.size() != req.productIds().stream().distinct().count() && products.size() != req.productIds().size()) {
            // size mismatch — at least one productId was not found
            for (Long pid : req.productIds()) {
                productRepo.findById(pid)
                    .orElseThrow(() -> new NotFoundException("Product not found: " + pid));
            }
        }
        for (Long pid : req.productIds()) {
            Product p = products.stream().filter(x -> x.getId().equals(pid)).findFirst()
                .orElseThrow(() -> new NotFoundException("Product not found: " + pid));
            if (p.getStock() < 1) {
                throw new ConflictException("Out of stock: " + p.getName());
            }
        }

        BigDecimal basePrice = size.basePrice();
        BigDecimal wrapPrice = wrap.extraCost();
        BigDecimal totalPrice = basePrice.add(wrapPrice);

        GiftBox box = GiftBox.builder()
            .user(user)
            .size(size)
            .wrapType(wrap)
            .customMessage(req.customMessage())
            .basePrice(basePrice)
            .wrapPrice(wrapPrice)
            .totalPrice(totalPrice)
            .status(GiftBoxStatus.IN_CART)
            .build();
        box = giftBoxRepo.save(box);

        for (Long pid : req.productIds()) {
            Product p = products.stream().filter(x -> x.getId().equals(pid)).findFirst().orElseThrow();
            GiftBoxItem item = GiftBoxItem.builder()
                .giftBox(box)
                .product(p)
                .build();
            box.getItems().add(item);
        }
        giftBoxRepo.save(box);
        return GiftBoxDto.from(box);
    }

    @Transactional(readOnly = true)
    public GiftBoxDto get(Long userId, Long boxId) {
        GiftBox box = giftBoxRepo.findById(boxId)
            .orElseThrow(() -> new NotFoundException("Gift box not found: " + boxId));
        if (!box.getUser().getId().equals(userId)) {
            throw new BadRequestException("Gift box does not belong to user");
        }
        return GiftBoxDto.from(box);
    }

    public void delete(Long userId, Long boxId) {
        GiftBox box = giftBoxRepo.findById(boxId)
            .orElseThrow(() -> new NotFoundException("Gift box not found: " + boxId));
        if (!box.getUser().getId().equals(userId)) {
            throw new BadRequestException("Gift box does not belong to user");
        }
        if (box.getStatus() == GiftBoxStatus.ORDERED) {
            throw new ConflictException("Cannot delete an ordered gift box");
        }
        giftBoxRepo.delete(box);
    }
}
