package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.BuildBox;
import com.prettycrafted.giftbox.dto.BuildBoxDto;
import com.prettycrafted.giftbox.dto.BuildBoxRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.BuildBoxRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BuildBoxService {

    private final BuildBoxRepository repo;

    /** Storefront: only active boxes. */
    public List<BuildBoxDto> listActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream().map(BuildBoxDto::from).toList();
    }

    /** Admin: all boxes. */
    public List<BuildBoxDto> listAll() {
        return repo.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(BuildBoxDto::from).toList();
    }

    @Transactional
    public BuildBoxDto create(BuildBoxRequest req) {
        BuildBox box = BuildBox.builder()
                .imageUrl(req.imageUrl())
                .title(req.title())
                .price(req.price())
                .displayOrder(req.displayOrder() != null ? req.displayOrder() : 0)
                .active(req.active() == null || req.active())
                .build();
        return BuildBoxDto.from(repo.save(box));
    }

    @Transactional
    public BuildBoxDto update(Long id, BuildBoxRequest req) {
        BuildBox box = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Build box not found: " + id));
        box.setImageUrl(req.imageUrl());
        box.setTitle(req.title());
        box.setPrice(req.price());
        if (req.displayOrder() != null) box.setDisplayOrder(req.displayOrder());
        if (req.active() != null) box.setActive(req.active());
        return BuildBoxDto.from(box);
    }

    @Transactional
    public BuildBoxDto toggle(Long id) {
        BuildBox box = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Build box not found: " + id));
        box.setActive(!box.getActive());
        return BuildBoxDto.from(box);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Build box not found: " + id);
        }
        repo.deleteById(id);
    }
}
