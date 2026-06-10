package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.HeroCard;
import com.prettycrafted.giftbox.dto.HeroCardDto;
import com.prettycrafted.giftbox.dto.HeroCardRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.HeroCardRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HeroCardService {

    private final HeroCardRepository repo;

    /** Storefront: only active cards. */
    public List<HeroCardDto> listActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream().map(HeroCardDto::from).toList();
    }

    /** Admin: all cards. */
    public List<HeroCardDto> listAll() {
        return repo.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(HeroCardDto::from).toList();
    }

    @Transactional
    public HeroCardDto create(HeroCardRequest req) {
        HeroCard card = HeroCard.builder()
                .imageUrl(req.imageUrl())
                .title(req.title())
                .type(req.type())
                .linkedProductId(req.linkedProductId())
                .displayOrder(req.displayOrder() != null ? req.displayOrder() : 0)
                .active(req.active() == null || req.active())
                .build();
        return HeroCardDto.from(repo.save(card));
    }

    @Transactional
    public HeroCardDto update(Long id, HeroCardRequest req) {
        HeroCard card = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Hero card not found: " + id));
        card.setImageUrl(req.imageUrl());
        card.setTitle(req.title());
        card.setType(req.type());
        card.setLinkedProductId(req.linkedProductId());
        if (req.displayOrder() != null) card.setDisplayOrder(req.displayOrder());
        if (req.active() != null) card.setActive(req.active());
        return HeroCardDto.from(card);
    }

    @Transactional
    public HeroCardDto toggle(Long id) {
        HeroCard card = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Hero card not found: " + id));
        card.setActive(!card.getActive());
        return HeroCardDto.from(card);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Hero card not found: " + id);
        }
        repo.deleteById(id);
    }
}
