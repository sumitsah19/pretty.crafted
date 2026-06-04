package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.AdminCustomerDto;
import com.prettycrafted.giftbox.dto.DashboardStatsDto;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.UpdateStockRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public DashboardStatsDto getStats() {
        BigDecimal revenue = orderRepo.sumRevenue();
        long totalOrders = orderRepo.count();
        Map<String, Long> byStatus = Arrays.stream(OrderStatus.values())
            .collect(Collectors.toMap(Enum::name, orderRepo::countByStatus));
        long totalProducts = productRepo.count();
        long lowStock = productRepo.countByStockLessThanEqual(LOW_STOCK_THRESHOLD);
        return new DashboardStatsDto(revenue, totalOrders, byStatus, totalProducts, lowStock);
    }

    @Transactional(readOnly = true)
    public Page<AdminCustomerDto> getCustomers(String q, Pageable pageable) {
        String query = (q != null && !q.isBlank()) ? q.trim() : null;
        Page<User> users = userRepo.searchCustomers(query, pageable);

        Map<Long, Object[]> stats = orderRepo.findUserOrderStats().stream()
            .collect(Collectors.toMap(row -> (Long) row[0], row -> row));

        return users.map(u -> {
            Object[] stat = stats.get(u.getId());
            long totalOrders  = stat != null ? ((Number) stat[1]).longValue() : 0L;
            BigDecimal totalSpent = stat != null ? (BigDecimal) stat[2] : BigDecimal.ZERO;
            return new AdminCustomerDto(
                u.getId(), u.getName(), u.getEmail(), u.getPhone(),
                u.isEmailVerified(), u.getCreatedAt(), totalOrders, totalSpent
            );
        });
    }

    public ProductDto updateStock(Long productId, UpdateStockRequest req) {
        Product p = productRepo.findById(productId)
            .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        p.setStock(req.quantity());
        return ProductDto.from(p);
    }
}
