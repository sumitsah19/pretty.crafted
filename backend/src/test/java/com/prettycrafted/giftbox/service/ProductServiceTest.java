package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.ProductRequest;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CartItemRepository;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.ReviewRepository;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository productRepo;
    @Mock CategoryRepository categoryRepo;
    @Mock ReviewRepository reviewRepo;
    @Mock CartItemRepository cartItemRepo;

    @InjectMocks ProductService service;

    @Captor ArgumentCaptor<Product> productCaptor;

    private static Category category(long id, String name) {
        return Category.builder().id(id).name(name).slug(name.toLowerCase()).build();
    }

    private static ProductRequest request(List<Long> categoryIds, List<String> recipients) {
        return request(categoryIds, recipients, null);
    }

    private static ProductRequest request(List<Long> categoryIds, List<String> recipients, String heroSlot) {
        return new ProductRequest(
            "Wildflower Soy Candle", "desc", null, null, null,
            new BigDecimal("499.00"), null, 10, List.of(),
            categoryIds, recipients, "", heroSlot
        );
    }

    // ─── Create — multiple categories ───────────────────────────────────────

    @Test
    void create_withMultipleCategoryIds_attachesAllOfThem() {
        Category candles = category(1L, "Candles");
        Category hampers = category(2L, "Hampers");
        when(categoryRepo.findAllById(List.of(1L, 2L))).thenReturn(List.of(candles, hampers));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProductDto dto = service.create(request(List.of(1L, 2L), List.of("her", "kids")));

        verify(productRepo).save(productCaptor.capture());
        assertEquals(2, productCaptor.getValue().getCategories().size());
        assertTrue(dto.categoryIds().containsAll(List.of(1L, 2L)));
        assertTrue(dto.recipients().containsAll(List.of("her", "kids")));
    }

    @Test
    void create_withUnknownCategoryId_throwsNotFound() {
        when(categoryRepo.findAllById(List.of(1L, 99L))).thenReturn(List.of(category(1L, "Candles")));

        assertThrows(NotFoundException.class,
            () -> service.create(request(List.of(1L, 99L), List.of())));

        verify(productRepo, never()).save(any());
    }

    @Test
    void create_withNoRecipients_defaultsToEmptySet_meaningEveryone() {
        when(categoryRepo.findAllById(List.of(1L))).thenReturn(List.of(category(1L, "Candles")));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProductDto dto = service.create(request(List.of(1L), null));

        assertTrue(dto.recipients().isEmpty());
    }

    // ─── Update — multiple categories / recipients ──────────────────────────

    @Test
    void update_replacesCategoriesAndRecipientsWithNewSelection() {
        Product existing = Product.builder()
            .id(5L).name("Old Name").price(new BigDecimal("100.00")).stock(1)
            .categories(new LinkedHashSet<>(List.of(category(1L, "Candles"))))
            .recipients(new LinkedHashSet<>(List.of("him")))
            .build();
        when(productRepo.findById(5L)).thenReturn(Optional.of(existing));
        Category hampers = category(2L, "Hampers");
        Category treats = category(3L, "Treats");
        when(categoryRepo.findAllById(List.of(2L, 3L))).thenReturn(List.of(hampers, treats));

        ProductDto dto = service.update(5L, request(List.of(2L, 3L), List.of("her")));

        assertEquals(Set.of(2L, 3L), Set.copyOf(dto.categoryIds()));
        assertEquals(List.of("her"), dto.recipients());
    }

    @Test
    void update_withUnknownProductId_throwsNotFound() {
        when(productRepo.findById(404L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.update(404L, request(List.of(1L), List.of())));
    }

    // ─── Hero slot (homepage hero carousel curation) ─────────────────────────

    @Test
    void create_withHeroSlot_isSaved() {
        when(categoryRepo.findAllById(List.of(1L))).thenReturn(List.of(category(1L, "Candles")));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProductDto dto = service.create(request(List.of(1L), List.of(), "her"));

        assertEquals("her", dto.heroSlot());
    }

    @Test
    void update_canClearHeroSlot() {
        Product existing = Product.builder()
            .id(5L).name("Old Name").price(new BigDecimal("100.00")).stock(1)
            .categories(new LinkedHashSet<>(List.of(category(1L, "Candles"))))
            .heroSlot("accessories")
            .build();
        when(productRepo.findById(5L)).thenReturn(Optional.of(existing));
        when(categoryRepo.findAllById(List.of(1L))).thenReturn(List.of(category(1L, "Candles")));

        ProductDto dto = service.update(5L, request(List.of(1L), List.of(), null));

        assertNull(dto.heroSlot());
    }

    // ─── Delete — blocked when the product has real history ─────────────────

    @Test
    void delete_withUnknownProductId_throwsNotFound() {
        when(productRepo.existsById(404L)).thenReturn(false);
        assertThrows(NotFoundException.class, () -> service.delete(404L));
        verify(productRepo, never()).deleteById(any());
    }

    @Test
    void delete_withOrderHistory_throwsConflictAndNeverDeletes() {
        when(productRepo.existsById(1L)).thenReturn(true);
        when(productRepo.existsInOrders(1L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.delete(1L));

        verify(productRepo, never()).deleteById(any());
    }

    @Test
    void delete_withReviews_throwsConflictAndNeverDeletes() {
        when(productRepo.existsById(1L)).thenReturn(true);
        when(productRepo.existsInOrders(1L)).thenReturn(false);
        when(reviewRepo.countByProductId(1L)).thenReturn(2L);

        assertThrows(ConflictException.class, () -> service.delete(1L));

        verify(productRepo, never()).deleteById(any());
    }

    @Test
    void delete_inSomeonesCart_throwsConflictAndNeverDeletes() {
        when(productRepo.existsById(1L)).thenReturn(true);
        when(productRepo.existsInOrders(1L)).thenReturn(false);
        when(reviewRepo.countByProductId(1L)).thenReturn(0L);
        when(cartItemRepo.existsByProductId(1L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.delete(1L));

        verify(productRepo, never()).deleteById(any());
    }

    @Test
    void delete_inSomeonesGiftBox_throwsConflictAndNeverDeletes() {
        when(productRepo.existsById(1L)).thenReturn(true);
        when(productRepo.existsInOrders(1L)).thenReturn(false);
        when(reviewRepo.countByProductId(1L)).thenReturn(0L);
        when(cartItemRepo.existsByProductId(1L)).thenReturn(false);
        when(productRepo.existsInGiftBoxes(1L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.delete(1L));

        verify(productRepo, never()).deleteById(any());
    }

    @Test
    void delete_withNoHistory_deletes() {
        when(productRepo.existsById(1L)).thenReturn(true);
        when(productRepo.existsInOrders(1L)).thenReturn(false);
        when(reviewRepo.countByProductId(1L)).thenReturn(0L);
        when(cartItemRepo.existsByProductId(1L)).thenReturn(false);
        when(productRepo.existsInGiftBoxes(1L)).thenReturn(false);

        service.delete(1L);

        verify(productRepo).deleteById(1L);
    }
}
