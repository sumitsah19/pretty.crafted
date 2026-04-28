package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.CartItem;
import com.prettycrafted.giftbox.domain.GiftBox;
import com.prettycrafted.giftbox.domain.GiftBoxStatus;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.AddCartItemRequest;
import com.prettycrafted.giftbox.dto.CartItemDto;
import com.prettycrafted.giftbox.dto.CartView;
import com.prettycrafted.giftbox.dto.GiftBoxDto;
import com.prettycrafted.giftbox.dto.UpdateCartItemRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CartItemRepository;
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
public class CartService {
    private final CartItemRepository cartRepo;
    private final GiftBoxRepository giftBoxRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public CartView view(Long userId) {
        List<CartItem> items = cartRepo.findByUserId(userId);
        List<GiftBox> boxes = giftBoxRepo.findByUserIdAndStatus(userId, GiftBoxStatus.IN_CART);

        List<CartItemDto> itemDtos = items.stream().map(CartItemDto::from).toList();
        List<GiftBoxDto> boxDtos = boxes.stream().map(GiftBoxDto::from).toList();

        BigDecimal itemsTotal = itemDtos.stream()
            .map(CartItemDto::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal boxesTotal = boxes.stream()
            .map(GiftBox::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal subtotal = itemsTotal.add(boxesTotal);

        return new CartView(itemDtos, boxDtos, subtotal, subtotal, itemDtos.size() + boxDtos.size());
    }

    public CartItemDto add(Long userId, AddCartItemRequest req) {
        User user = loadUser(userId);
        Product product = productRepo.findById(req.productId())
            .orElseThrow(() -> new NotFoundException("Product not found: " + req.productId()));
        if (product.getStock() < req.quantity()) {
            throw new ConflictException("Not enough stock for " + product.getName());
        }
        CartItem item = cartRepo.findByUserIdAndProductId(userId, product.getId())
            .map(existing -> {
                int next = existing.getQuantity() + req.quantity();
                if (product.getStock() < next) {
                    throw new ConflictException("Not enough stock for " + product.getName());
                }
                existing.setQuantity(next);
                return existing;
            })
            .orElseGet(() -> cartRepo.save(CartItem.builder()
                .user(user)
                .product(product)
                .quantity(req.quantity())
                .build()));
        return CartItemDto.from(item);
    }

    public CartItemDto update(Long userId, Long cartItemId, UpdateCartItemRequest req) {
        CartItem item = cartRepo.findById(cartItemId)
            .orElseThrow(() -> new NotFoundException("Cart item not found: " + cartItemId));
        if (!item.getUser().getId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }
        if (item.getProduct().getStock() < req.quantity()) {
            throw new ConflictException("Not enough stock for " + item.getProduct().getName());
        }
        item.setQuantity(req.quantity());
        return CartItemDto.from(item);
    }

    public void remove(Long userId, Long cartItemId) {
        CartItem item = cartRepo.findById(cartItemId)
            .orElseThrow(() -> new NotFoundException("Cart item not found: " + cartItemId));
        if (!item.getUser().getId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }
        cartRepo.delete(item);
    }

    public void clear(Long userId) {
        cartRepo.deleteByUserId(userId);
        for (GiftBox box : giftBoxRepo.findByUserIdAndStatus(userId, GiftBoxStatus.IN_CART)) {
            giftBoxRepo.delete(box);
        }
    }

    private User loadUser(Long userId) {
        return userRepo.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }
}
