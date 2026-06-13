package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.BoxSize;
import com.prettycrafted.giftbox.domain.BuildBox;
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
import com.prettycrafted.giftbox.repository.BuildBoxRepository;
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
    private final BuildBoxRepository buildBoxRepo;

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

        // Reject duplicate productIds before any DB lookup
        if (req.productIds().size() != req.productIds().stream().distinct().count()) {
            throw new BadRequestException("Duplicate products are not allowed in a gift box");
        }

        List<Product> products = productRepo.findAllById(req.productIds());
        if (products.size() != req.productIds().size()) {
            for (Long pid : req.productIds()) {
                productRepo.findById(pid)
                    .orElseThrow(() -> new NotFoundException("Product not found: " + pid));
            }
        }
        for (Product p : products) {
            if (p.getStock() < 1) {
                throw new ConflictException("Out of stock: " + p.getName());
            }
        }

        // Snapshot the chosen box. A real admin box (buildBoxId) is authoritative — copy its
        // current title/image and use its admin-set per-size price as the box base. A built-in
        // gradient box has no DB row, so keep just its label and use the BoxSize enum base.
        Long buildBoxId = req.buildBoxId();
        String boxTitle = req.boxTitle();
        String boxImageUrl = null;
        BigDecimal basePrice = size.basePrice();
        if (buildBoxId != null) {
            BuildBox source = buildBoxRepo.findById(buildBoxId)
                .orElseThrow(() -> new NotFoundException("Build box not found: " + req.buildBoxId()));
            boxTitle = source.getTitle();
            boxImageUrl = source.getImageUrl();
            // The admin per-size price REPLACES the size fee; fall back to the enum
            // base only when this box has no price set for the chosen size.
            BigDecimal perSize = source.priceForSize(size);
            if (perSize != null) basePrice = perSize;
        }
        BigDecimal wrapPrice = wrap.extraCost();
        BigDecimal productsTotal = products.stream()
            .map(Product::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPrice = basePrice.add(wrapPrice).add(productsTotal);

        GiftBox box = GiftBox.builder()
            .user(user)
            .size(size)
            .wrapType(wrap)
            .customMessage(req.customMessage())
            .buildBoxId(buildBoxId)
            .boxTitle(boxTitle)
            .boxImageUrl(boxImageUrl)
            .basePrice(basePrice)
            .wrapPrice(wrapPrice)
            .productsTotal(productsTotal)
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

    /**
     * The user's IN_CART boxes — what {@link OrderService#place} will actually
     * order. Lets the checkout reconcile its local cart against the server
     * before placing (a locally-removed box whose delete request was lost must
     * not be silently charged).
     */
    @Transactional(readOnly = true)
    public List<GiftBoxDto> listInCart(Long userId) {
        return giftBoxRepo.findByUserIdAndStatus(userId, GiftBoxStatus.IN_CART)
            .stream().map(GiftBoxDto::from).toList();
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
