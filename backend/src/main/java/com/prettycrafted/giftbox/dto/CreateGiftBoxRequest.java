package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.BoxSize;
import com.prettycrafted.giftbox.domain.WrapType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateGiftBoxRequest(
    @NotNull BoxSize size,
    @NotNull WrapType wrapType,
    @Size(max = 150) String customMessage,
    @NotEmpty List<@NotNull Long> productIds,
    // The chosen "Build Your Own Box" design. When buildBoxId is set, the server snapshots the
    // box's title/image from the DB (authoritative). boxTitle is used only as the label for a
    // built-in gradient box that has no DB row.
    Long buildBoxId,
    @Size(max = 160) String boxTitle
) {}
