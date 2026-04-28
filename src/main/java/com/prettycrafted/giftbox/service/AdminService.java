package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.dto.DashboardStatsDto;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.UpdateStockRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;

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

    public ProductDto updateStock(Long productId, UpdateStockRequest req) {
        Product p = productRepo.findById(productId)
            .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        p.setStock(req.quantity());
        return ProductDto.from(p);
    }
}
