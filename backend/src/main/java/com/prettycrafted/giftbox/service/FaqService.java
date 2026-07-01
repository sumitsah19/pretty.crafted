package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Faq;
import com.prettycrafted.giftbox.dto.FaqDto;
import com.prettycrafted.giftbox.dto.FaqRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.FaqRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaqService {

    private final FaqRepository repo;

    /** Storefront: only active FAQs. */
    public List<FaqDto> listActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream().map(FaqDto::from).toList();
    }

    /** Admin: all FAQs. */
    public List<FaqDto> listAll() {
        return repo.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(FaqDto::from).toList();
    }

    @Transactional
    public FaqDto create(FaqRequest req) {
        Faq faq = Faq.builder()
                .question(req.question())
                .answer(req.answer())
                .category(req.category())
                .displayOrder(req.displayOrder() != null ? req.displayOrder() : 0)
                .active(req.active() == null || req.active())
                .build();
        return FaqDto.from(repo.save(faq));
    }

    @Transactional
    public FaqDto update(Long id, FaqRequest req) {
        Faq faq = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("FAQ not found: " + id));
        faq.setQuestion(req.question());
        faq.setAnswer(req.answer());
        faq.setCategory(req.category());
        if (req.displayOrder() != null) faq.setDisplayOrder(req.displayOrder());
        if (req.active() != null) faq.setActive(req.active());
        return FaqDto.from(faq);
    }

    @Transactional
    public FaqDto toggle(Long id) {
        Faq faq = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("FAQ not found: " + id));
        faq.setActive(!faq.getActive());
        return FaqDto.from(faq);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("FAQ not found: " + id);
        }
        repo.deleteById(id);
    }
}
