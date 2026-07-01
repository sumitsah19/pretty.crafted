package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Occasion;
import com.prettycrafted.giftbox.dto.OccasionDto;
import com.prettycrafted.giftbox.dto.OccasionRequest;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.OccasionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OccasionService {

    private final OccasionRepository repo;

    /** Every occasion, in browse-row order — used by both the public storefront and admin. */
    public List<OccasionDto> listAll() {
        return repo.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(OccasionDto::from).toList();
    }

    @Transactional
    public OccasionDto create(OccasionRequest req) {
        if (repo.existsBySlug(req.slug())) {
            throw new ConflictException("An occasion with slug '" + req.slug() + "' already exists");
        }
        Occasion occasion = Occasion.builder()
                .slug(req.slug())
                .title(req.title())
                .description(req.description())
                .icon(req.icon())
                .iconImageUrl(req.iconImageUrl())
                .color(req.color())
                .season(req.season())
                .ctaLabel(req.ctaLabel())
                .active(req.active() != null && req.active())
                .priority(req.priority() != null ? req.priority() : 0)
                .displayOrder(req.displayOrder() != null ? req.displayOrder() : 0)
                .build();
        return OccasionDto.from(repo.save(occasion));
    }

    @Transactional
    public OccasionDto update(Long id, OccasionRequest req) {
        Occasion occasion = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Occasion not found: " + id));
        if (repo.existsBySlugAndIdNot(req.slug(), id)) {
            throw new ConflictException("An occasion with slug '" + req.slug() + "' already exists");
        }
        occasion.setSlug(req.slug());
        occasion.setTitle(req.title());
        occasion.setDescription(req.description());
        occasion.setIcon(req.icon());
        occasion.setIconImageUrl(req.iconImageUrl());
        occasion.setColor(req.color());
        occasion.setSeason(req.season());
        occasion.setCtaLabel(req.ctaLabel());
        if (req.active() != null) occasion.setActive(req.active());
        if (req.priority() != null) occasion.setPriority(req.priority());
        if (req.displayOrder() != null) occasion.setDisplayOrder(req.displayOrder());
        return OccasionDto.from(occasion);
    }

    @Transactional
    public OccasionDto toggle(Long id) {
        Occasion occasion = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Occasion not found: " + id));
        occasion.setActive(!occasion.getActive());
        return OccasionDto.from(occasion);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Occasion not found: " + id);
        }
        repo.deleteById(id);
    }
}
