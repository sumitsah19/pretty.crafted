package com.prettycrafted.giftbox.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.prettycrafted.giftbox.domain.Occasion;
import com.prettycrafted.giftbox.repository.OccasionRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SitemapServiceTest {

    @Mock private OccasionRepository occasionRepo;
    @Mock private ProductRepository productRepo;
    @InjectMocks private SitemapService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "frontendUrl", "https://prettycrafted.com/");
    }

    private static Occasion occasion(String slug) {
        return Occasion.builder().slug(slug).visible(true).build();
    }

    @Test
    void includesStaticRoutesVisibleOccasionsAndProducts() {
        when(occasionRepo.findByVisibleTrueOrderByDisplayOrderAscIdAsc())
                .thenReturn(List.of(occasion("mothers"), occasion("diwali")));
        when(productRepo.findAllIdsAndImageUrls()).thenReturn(List.of(
                new Object[]{1L, "https://res.cloudinary.com/demo/box.jpg"},
                new Object[]{2L, null}));

        String xml = service.generateXml();

        // Core landing + policy pages
        assertThat(xml).contains("<loc>https://prettycrafted.com/</loc>");
        assertThat(xml).contains("<loc>https://prettycrafted.com/shop</loc>");
        assertThat(xml).contains("<loc>https://prettycrafted.com/gift-boxes</loc>");
        assertThat(xml).contains("<loc>https://prettycrafted.com/privacy</loc>");
        assertThat(xml).contains("<loc>https://prettycrafted.com/contact-support</loc>");

        // Only the occasions the DB says are visible
        assertThat(xml).contains("<loc>https://prettycrafted.com/occasions/mothers</loc>");
        assertThat(xml).contains("<loc>https://prettycrafted.com/occasions/diwali</loc>");

        // Products, with the image extension only when an image exists
        assertThat(xml).contains("<loc>https://prettycrafted.com/products/1</loc>"
                + "<image:image><image:loc>https://res.cloudinary.com/demo/box.jpg</image:loc></image:image>");
        assertThat(xml).contains("<loc>https://prettycrafted.com/products/2</loc><changefreq>");
        assertThat(xml).doesNotContain("<loc>https://prettycrafted.com/products/2</loc><image:image>");

        // Well-formed envelope with the image namespace, base URL slash trimmed
        assertThat(xml).startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        assertThat(xml).contains("xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\"");
        assertThat(xml).endsWith("</urlset>\n");
        assertThat(xml).doesNotContain("https://prettycrafted.com//");
    }

    @Test
    void escapesXmlSpecialCharactersInAdminEnteredSlugs() {
        when(occasionRepo.findByVisibleTrueOrderByDisplayOrderAscIdAsc())
                .thenReturn(List.of(occasion("tom&jerry<day>")));
        when(productRepo.findAllIdsAndImageUrls()).thenReturn(List.of());

        String xml = service.generateXml();

        assertThat(xml).contains("/occasions/tom&amp;jerry&lt;day&gt;");
        assertThat(xml).doesNotContain("tom&jerry<day>");
    }

    @Test
    void emptyCatalogStillProducesValidSitemap() {
        when(occasionRepo.findByVisibleTrueOrderByDisplayOrderAscIdAsc()).thenReturn(List.of());
        when(productRepo.findAllIdsAndImageUrls()).thenReturn(List.of());

        String xml = service.generateXml();

        assertThat(xml).contains("<loc>https://prettycrafted.com/</loc>");
        assertThat(xml).doesNotContain("/products/");
        assertThat(xml).doesNotContain("/occasions/mothers");
        assertThat(xml).endsWith("</urlset>\n");
    }
}
