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

    /** Admin: every occasion, including hidden ones. */
    public List<OccasionDto> listAll() {
        return repo.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(OccasionDto::from).toList();
    }

    /** Storefront: only visible occasions — feeds the browse row and featured banner. */
    public List<OccasionDto> listVisible() {
        return repo.findByVisibleTrueOrderByDisplayOrderAscIdAsc()
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
                .visible(req.visible() == null || req.visible())
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
        if (req.visible() != null) occasion.setVisible(req.visible());
        if (req.displayOrder() != null) occasion.setDisplayOrder(req.displayOrder());
        return OccasionDto.from(occasion);
    }

    /** Flips featured-banner eligibility. Does not affect {@code featured}. */
    @Transactional
    public OccasionDto toggle(Long id) {
        Occasion occasion = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Occasion not found: " + id));
        occasion.setActive(!occasion.getActive());
        return OccasionDto.from(occasion);
    }

    /** Hide/Show. Does not affect {@code active} or {@code featured}. */
    @Transactional
    public OccasionDto toggleVisibility(Long id) {
        Occasion occasion = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Occasion not found: " + id));
        occasion.setVisible(!occasion.getVisible());
        return OccasionDto.from(occasion);
    }

    /**
     * Toggles whether this occasion is THE featured banner. At most one occasion
     * can be featured at a time — marking one featured automatically un-features
     * whichever occasion held that spot before.
     *
     * <p>Uses {@link OccasionRepository#findAllForUpdate()} to pessimistic-lock
     * every occasion row before reading or changing {@code featured}. Without
     * this, two concurrent toggles (e.g. two admins each clicking "Set as
     * Featured" within the same instant) could both read the same prior state
     * and both write {@code featured=true}, leaving two rows featured — which
     * would then crash the featured-occasion lookup elsewhere. With the lock,
     * the second caller blocks until the first transaction commits and then
     * operates on the now-current state, so the invariant always holds.
     */
    @Transactional
    public OccasionDto toggleFeatured(Long id) {
        List<Occasion> all = repo.findAllForUpdate();
        Occasion occasion = all.stream()
                .filter(o -> o.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Occasion not found: " + id));
        boolean makeFeatured = !occasion.getFeatured();
        if (makeFeatured) {
            all.forEach(o -> {
                if (!o.getId().equals(id) && Boolean.TRUE.equals(o.getFeatured())) o.setFeatured(false);
            });
        }
        occasion.setFeatured(makeFeatured);
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
