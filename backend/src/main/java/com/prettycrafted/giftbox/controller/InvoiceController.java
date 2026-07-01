package com.prettycrafted.giftbox.controller;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.prettycrafted.giftbox.dto.OrderDto;
import com.prettycrafted.giftbox.dto.OrderItemDto;
import com.prettycrafted.giftbox.service.OrderService;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class InvoiceController {
    private final OrderService orderService;

    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> invoice(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long uid = userId(jwt);
        OrderDto order = orderService.get(uid, id);
        String html = buildInvoiceHtml(order);
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            byte[] pdf = os.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                    ContentDisposition.builder("attachment").filename("invoice-" + order.id() + ".pdf").build());
            headers.setContentLength(pdf.length);
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to generate PDF invoice for order {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    private String escape(String s) {
        if (s == null)
            return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'",
                "&#39;");
    }

    // Indian-grouped currency, e.g. "Rs. 1,23,456.00". We deliberately use the
    // "Rs." text prefix rather than the ₹ symbol (U+20B9): the PDF base fonts
    // (Helvetica) don't contain that glyph, so it would render as a blank box on
    // any server without an Indian-glyph font installed.
    private static final NumberFormat INR = NumberFormat.getInstance(Locale.forLanguageTag("en-IN"));
    static {
        INR.setMinimumFractionDigits(2);
        INR.setMaximumFractionDigits(2);
    }

    private String money(BigDecimal v) {
        if (v == null)
            return "Rs. 0.00";
        return "Rs. " + INR.format(v);
    }

    private String buildInvoiceHtml(OrderDto o) {
        DateTimeFormatter df = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm").withZone(ZoneId.systemDefault());
        String date = o.createdAt() != null ? df.format(o.createdAt()) : "";
        StringBuilder items = new StringBuilder();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemDto it : o.items()) {
            BigDecimal unit = it.unitPrice() == null ? BigDecimal.ZERO : it.unitPrice();
            BigDecimal line = it.lineTotal() == null ? BigDecimal.ZERO : it.lineTotal();
            subtotal = subtotal.add(line);
            items.append("<tr>")
                    .append("<td style=\"padding:8px;border-bottom:1px solid #eee\">" + escape(it.itemName()) + "</td>")
                    .append("<td style=\"padding:8px;border-bottom:1px solid #eee;text-align:center\">" + it.quantity()
                            + "</td>")
                    .append("<td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right\">" + money(unit)
                            + "</td>")
                    .append("<td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right\">" + money(line)
                            + "</td>")
                    .append("</tr>");
        }

        String shipping = escape(o.shippingAddress());

        BigDecimal discount = o.discountAmount() == null ? BigDecimal.ZERO : o.discountAmount();
        StringBuilder summary = new StringBuilder();
        summary.append("<tr><td>Subtotal</td><td style=\"text-align:right\">" + money(subtotal) + "</td></tr>");
        if (discount.signum() > 0) {
            String label = o.couponCode() != null && !o.couponCode().isBlank()
                    ? "Discount (" + escape(o.couponCode()) + ")"
                    : "Discount";
            summary.append("<tr style=\"color:#7A9A6B\"><td>" + label + "</td><td style=\"text-align:right\">- "
                    + money(discount) + "</td></tr>");
        }
        // Delivery fee (null on orders that predate it — shown as Free).
        BigDecimal deliveryFee = o.deliveryFee() == null ? BigDecimal.ZERO : o.deliveryFee();
        summary.append("<tr><td>Delivery</td><td style=\"text-align:right\">"
                + (deliveryFee.signum() > 0 ? money(deliveryFee) : "Free") + "</td></tr>");
        summary.append(
                "<tr class=\"grand\"><td>Total</td><td style=\"text-align:right\">" + money(o.totalAmount())
                        + "</td></tr>");

        String html = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Invoice #" + o.id() + "</title>" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
                "<style>body{font-family: Arial, Helvetica, sans-serif;color:#2C1A0E;padding:24px} .header{display:flex;justify-content:space-between;align-items:flex-start} .brand{font-family:'Playfair Display',serif;font-size:20px;color:#C4704A} table{width:100%;border-collapse:collapse;margin-top:18px} th,td{padding:8px;text-align:left} .right{text-align:right} .muted{color:#6B4F3A;font-size:13px} .summary{width:260px;margin-left:auto;margin-top:16px;border-collapse:collapse} .summary td{padding:6px 0;border:none} .summary tr.grand td{font-weight:800;font-size:16px;border-top:2px solid #2C1A0E;padding-top:10px}</style></head><body>"
                +
                "<div class=\"header\"><div><div class=\"brand\">Prettycrafted</div><div class=\"muted\">Invoice #: "
                + o.id() + "</div></div><div style=\"text-align:right\"><div style=\"font-weight:700\">"
                + money(o.totalAmount()) + "</div><div class=\"muted\">" + date + "</div></div></div><hr/>" +
                "<div style=\"display:flex;gap:20px;margin-top:10px\"><div><div style=\"font-weight:700\">Bill To</div><div class=\"muted\">"
                + shipping + "</div></div></div>" +
                "<table class=\"items\"><thead><tr><th style=\"text-align:left\">Item</th><th style=\"text-align:center\">Qty</th><th style=\"text-align:right\">Price</th><th style=\"text-align:right\">Total</th></tr></thead><tbody>"
                + items.toString() + "</tbody></table>" +
                "<table class=\"summary\">" + summary.toString() + "</table>"
                + "<div style=\"margin-top:18px;font-size:12px;color:#9C7A63\">Thank you for ordering from Prettycrafted. This is an electronically generated invoice.</div></body></html>";

        return html;
    }
}
