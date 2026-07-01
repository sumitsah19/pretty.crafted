package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.dto.CategoryRequest;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock CategoryRepository repo;
    @InjectMocks CategoryService service;

    private static CategoryRequest request() {
        return new CategoryRequest("Candles", "candles", "Scented soy candles", null);
    }

    @Test
    void create_withDuplicateName_throwsConflictNotRawDbError() {
        when(repo.existsByName("Candles")).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class, () -> service.create(request()));
        assertTrue(ex.getMessage().contains("Candles"));
        verify(repo, never()).save(any());
    }

    @Test
    void create_withDuplicateSlug_throwsConflict() {
        when(repo.existsByName("Candles")).thenReturn(false);
        when(repo.existsBySlug("candles")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.create(request()));
        verify(repo, never()).save(any());
    }

    @Test
    void create_whenUnique_saves() {
        when(repo.existsByName("Candles")).thenReturn(false);
        when(repo.existsBySlug("candles")).thenReturn(false);
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertEquals("Candles", service.create(request()).name());
        verify(repo).save(any());
    }

    @Test
    void update_toNameOwnedByAnotherCategory_throwsConflict() {
        Category existing = Category.builder().id(5L).name("Old").slug("old").build();
        when(repo.findById(5L)).thenReturn(Optional.of(existing));
        when(repo.existsByNameAndIdNot("Candles", 5L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.update(5L, request()));
    }

    @Test
    void update_unknownId_throwsNotFound() {
        when(repo.findById(404L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.update(404L, request()));
    }

    @Test
    void update_keepingOwnNameAndSlug_succeeds() {
        Category existing = Category.builder().id(5L).name("Old").slug("old").build();
        when(repo.findById(5L)).thenReturn(Optional.of(existing));
        when(repo.existsByNameAndIdNot("Candles", 5L)).thenReturn(false);
        when(repo.existsBySlugAndIdNot("candles", 5L)).thenReturn(false);

        assertEquals("Candles", service.update(5L, request()).name());
    }
}
