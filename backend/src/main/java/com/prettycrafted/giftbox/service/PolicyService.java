package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Policy;
import com.prettycrafted.giftbox.dto.PolicyDto;
import com.prettycrafted.giftbox.dto.PolicyRequest;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.PolicyRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyService {

    private final PolicyRepository repo;

    /** Storefront: only active policies (footer / legal menu listing). */
    public List<PolicyDto> listActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream().map(PolicyDto::from).toList();
    }

    /** Admin: every policy. */
    public List<PolicyDto> listAll() {
        return repo.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(PolicyDto::from).toList();
    }

    /** Storefront: fetch a single policy page by slug. */
    public PolicyDto getBySlug(String slug) {
        Policy policy = repo.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new NotFoundException("Policy not found: " + slug));
        return PolicyDto.from(policy);
    }

    @Transactional
    public PolicyDto create(PolicyRequest req) {
        if (repo.existsBySlug(req.slug())) {
            throw new ConflictException("A policy with slug '" + req.slug() + "' already exists");
        }
        Policy policy = Policy.builder()
                .slug(req.slug())
                .title(req.title())
                .shortDescription(req.shortDescription())
                .content(req.content())
                .effectiveDate(req.effectiveDate())
                .lastUpdatedDate(req.lastUpdatedDate())
                .displayOrder(req.displayOrder() != null ? req.displayOrder() : 0)
                .active(req.active() == null || req.active())
                .build();
        return PolicyDto.from(repo.save(policy));
    }

    @Transactional
    public PolicyDto update(Long id, PolicyRequest req) {
        Policy policy = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Policy not found: " + id));
        if (repo.existsBySlugAndIdNot(req.slug(), id)) {
            throw new ConflictException("A policy with slug '" + req.slug() + "' already exists");
        }
        policy.setSlug(req.slug());
        policy.setTitle(req.title());
        policy.setShortDescription(req.shortDescription());
        policy.setContent(req.content());
        policy.setEffectiveDate(req.effectiveDate());
        policy.setLastUpdatedDate(req.lastUpdatedDate());
        if (req.displayOrder() != null) policy.setDisplayOrder(req.displayOrder());
        if (req.active() != null) policy.setActive(req.active());
        return PolicyDto.from(policy);
    }

    @Transactional
    public PolicyDto toggle(Long id) {
        Policy policy = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Policy not found: " + id));
        policy.setActive(!policy.getActive());
        return PolicyDto.from(policy);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Policy not found: " + id);
        }
        repo.deleteById(id);
    }
}
