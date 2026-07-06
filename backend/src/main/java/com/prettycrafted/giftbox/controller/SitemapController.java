package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.service.SitemapService;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Live sitemap for search engines, generated from the DB (visible occasions +
 * full product catalog + static routes). Lives under /api/public/** so it
 * bypasses JWT (SecurityConfig chain 1). The storefront's /sitemap.xml is
 * rewritten here by Vercel — see frontend/vercel.json.
 */
@RestController
@RequiredArgsConstructor
public class SitemapController {

    private final SitemapService service;

    @GetMapping(value = "/api/public/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        return ResponseEntity.ok()
                // Crawlers refetch sitemaps infrequently; an hour of caching
                // keeps repeat hits off the DB without delaying updates much.
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(service.generateXml());
    }
}
