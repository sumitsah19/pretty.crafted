package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderItem;
import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.ReturnRequest;
import com.prettycrafted.giftbox.domain.ReturnStatus;
import com.prettycrafted.giftbox.dto.CreateReturnRequest;
import com.prettycrafted.giftbox.dto.ReturnRequestDto;
import com.prettycrafted.giftbox.dto.UpdateReturnStatusRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.repository.ReturnRequestRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnService {

    // A new request cannot be raised for an item that already has one of these.
    private static final List<ReturnStatus> OPEN_STATUSES =
            List.of(ReturnStatus.PENDING, ReturnStatus.APPROVED);

    private final ReturnRequestRepository repo;
    private final OrderRepository orderRepo;

    /** Customer: raise a return/exchange for one item of a delivered order they own. */
    @Transactional
    public ReturnRequestDto create(Long userId, CreateReturnRequest req) {
        Order order = orderRepo.findById(req.orderId())
                .filter(o -> o.getUser() != null && o.getUser().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Order not found: " + req.orderId()));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Only delivered orders are eligible for returns or exchanges.");
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(req.orderItemId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Item not found in this order: " + req.orderItemId()));

        if (repo.existsByOrderItemIdAndStatusIn(item.getId(), OPEN_STATUSES)) {
            throw new ConflictException("There is already an open request for this item.");
        }

        ReturnRequest rr = ReturnRequest.builder()
                .user(order.getUser())
                .order(order)
                .orderItem(item)
                .itemName(item.getItemName())
                .type(req.type())
                .reason(req.reason())
                .details(req.details())
                .images(req.images() != null ? req.images() : List.of())
                .status(ReturnStatus.PENDING)
                .build();
        return ReturnRequestDto.from(repo.save(rr));
    }

    /** Customer: list their own requests, newest first. */
    public List<ReturnRequestDto> listMine(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(ReturnRequestDto::from).toList();
    }

    /** Admin: all requests, optionally filtered by status. */
    public List<ReturnRequestDto> adminList(ReturnStatus status) {
        List<ReturnRequest> rows = (status == null)
                ? repo.findAllByOrderByCreatedAtDesc()
                : repo.findByStatusOrderByCreatedAtDesc(status);
        return rows.stream().map(ReturnRequestDto::from).toList();
    }

    /** Admin: move a request through its lifecycle and optionally attach a note. */
    @Transactional
    public ReturnRequestDto updateStatus(Long id, UpdateReturnStatusRequest req) {
        ReturnRequest rr = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + id));
        rr.setStatus(req.status());
        if (req.adminNote() != null) rr.setAdminNote(req.adminNote());
        return ReturnRequestDto.from(rr);
    }
}
