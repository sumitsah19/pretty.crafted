package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.Review;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.CreateReviewRequest;
import com.prettycrafted.giftbox.dto.ReviewDto;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.ReviewRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final Set<OrderStatus> PURCHASED_STATUSES =
        Set.of(OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED);

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<ReviewDto> getReviews(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
            .stream()
            .map(ReviewDto::from)
            .toList();
    }

    public boolean canReview(Long productId, Long userId) {
        if (reviewRepository.existsByProductIdAndUserId(productId, userId)) {
            return false;
        }
        return orderRepository.countUserPurchasesOfProduct(userId, productId, PURCHASED_STATUSES) > 0;
    }

    @Transactional
    public ReviewDto submitReview(Long userId, CreateReviewRequest req) {
        if (!canReview(req.productId(), userId)) {
            if (reviewRepository.existsByProductIdAndUserId(req.productId(), userId)) {
                throw new ConflictException("You have already reviewed this product");
            }
            throw new BadRequestException("You can only review products you have purchased");
        }

        Product product = productRepository.findById(req.productId())
            .orElseThrow(() -> new NotFoundException("Product not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        Review review = Review.builder()
            .product(product)
            .user(user)
            .rating(req.rating())
            .body(req.body())
            .build();

        return ReviewDto.from(reviewRepository.save(review));
    }
}
