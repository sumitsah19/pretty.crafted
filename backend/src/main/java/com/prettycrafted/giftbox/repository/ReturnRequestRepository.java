package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.ReturnRequest;
import com.prettycrafted.giftbox.domain.ReturnStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    /** Customer: their own requests, newest first. */
    List<ReturnRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Admin: every request, newest first. */
    List<ReturnRequest> findAllByOrderByCreatedAtDesc();

    /** Admin: requests filtered by status, newest first. */
    List<ReturnRequest> findByStatusOrderByCreatedAtDesc(ReturnStatus status);

    /** Guard against duplicate open requests for the same item. */
    boolean existsByOrderItemIdAndStatusIn(Long orderItemId, List<ReturnStatus> statuses);
}
