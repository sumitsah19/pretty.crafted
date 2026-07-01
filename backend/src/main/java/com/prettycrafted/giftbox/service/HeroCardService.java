package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.dto.HeroCardDto;
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
}
