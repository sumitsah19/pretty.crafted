package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.BuildBoxDto;
import com.prettycrafted.giftbox.service.BuildBoxService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public: "Build Your Own Box" CoverFlow boxes for the storefront. */
@RestController
@RequestMapping("/api/public/build-boxes")
@RequiredArgsConstructor
public class BuildBoxController {
    private final BuildBoxService service;

    @GetMapping
    public List<BuildBoxDto> list() {
        return service.listActive();
    }
}
