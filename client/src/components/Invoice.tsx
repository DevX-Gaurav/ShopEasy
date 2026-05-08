import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Order, User } from "@/lib/types";
import { formatINR, formatDateTime } from "@/lib/format";
import { ShoppingBag } from "lucide-react";

interface Props {
  order: Order;
  vendor?: User;
  /** When true, the invoice is restricted to the items belonging to `vendor`. */
  vendorScoped?: boolean;
}

/** Print-quality invoice ready for html2canvas + jsPDF capture. */
export const Invoice = forwardRef<HTMLDivElement, Props>(({ order, vendor, vendorScoped }, ref) => {
  const items = vendorScoped && vendor ? order.items.filter((i) => i.vendorId === vendor.id) : order.items;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = vendorScoped ? 0 : order.shipping;
  const total = subtotal + shipping;

  const qrPayload = JSON.stringify({
    orderId: order.id,
    customer: order.customerName,
    total,
    issuedAt: order.createdAt,
  });

  return (
    <div
      ref={ref}
      className="mx-auto bg-white text-slate-900"
      style={{ width: 794, padding: 48, fontFamily: "DM Sans, system-ui, sans-serif" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #f1f5f9", paddingBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#e8511f,#f59345)", color: "#fff" }}>
              <ShoppingBag size={22} />
            </span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>shopeasy</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Multi-vendor marketplace</div>
            </div>
          </div>
          <div style={{ marginTop: 18, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            ShopEasy Marketplace Pvt. Ltd.<br />
            8th Floor, Crescent Tower, Bandra Kurla Complex<br />
            Mumbai 400051 · GSTIN: 27ABCDE1234F1Z5<br />
            hello@shopeasy.com · +91 1800-123-456
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "#0f172a" }}>INVOICE</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            <div>
              <span style={{ color: "#94a3b8" }}>Invoice #</span>{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>INV-{order.id}</span>
            </div>
            <div>
              <span style={{ color: "#94a3b8" }}>Order #</span>{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{order.id}</span>
            </div>
            <div>
              <span style={{ color: "#94a3b8" }}>Issued</span>{" "}
              <span style={{ color: "#0f172a", fontWeight: 600 }}>{formatDateTime(order.createdAt)}</span>
            </div>
            <div style={{ marginTop: 6, display: "inline-block", padding: "4px 10px", borderRadius: 999, background: order.status === "Cancelled" ? "#fee2e2" : "#dcfce7", color: order.status === "Cancelled" ? "#991b1b" : "#166534", fontSize: 11, fontWeight: 700 }}>
              {order.status}
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 200px", gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Bill from</div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{vendor?.shopName ?? vendor?.name ?? "ShopEasy Marketplace"}</div>
          {vendor && (
            <div style={{ marginTop: 4, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
              {vendor.name}<br />
              {vendor.address}<br />
              {vendor.phone}<br />
              {vendor.email}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Bill to</div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{order.customerName}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            {order.shippingAddress}<br />
            {order.customerPhone}<br />
            {order.customerEmail}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>
          <div style={{ padding: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
            <QRCodeSVG value={qrPayload} size={120} level="M" includeMargin={false} fgColor="#0f172a" bgColor="#ffffff" />
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#94a3b8", textAlign: "center", maxWidth: 140 }}>
            Scan to verify this order
          </div>
        </div>
      </div>

      {/* Items */}
      <table style={{ marginTop: 28, width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#0f172a", color: "#fff" }}>
            <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Item</th>
            <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Unit price</th>
            <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "12px", color: "#94a3b8", fontFamily: "monospace" }}>{String(i + 1).padStart(2, "0")}</td>
              <td style={{ padding: "12px" }}>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{it.name}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: "#64748b" }}>
                  {[it.selectedColor, it.selectedSize].filter(Boolean).join(" · ") || "Standard"}
                </div>
              </td>
              <td style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>{it.quantity}</td>
              <td style={{ padding: "12px", textAlign: "right", fontFamily: "monospace" }}>{formatINR(it.price)}</td>
              <td style={{ padding: "12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{formatINR(it.price * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 280 }}>
          <Row label="Subtotal" value={formatINR(subtotal)} />
          <Row label="Shipping" value={shipping === 0 ? "Free" : formatINR(shipping)} />
          <div style={{ borderTop: "2px solid #0f172a", marginTop: 8, paddingTop: 8 }}>
            <Row label="Total payable" value={formatINR(total)} bold />
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
            Paid via {order.paymentMethod}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Thank you for your order!</div>
          Returns accepted within 7 days of delivery. Visit shopeasy.com/help for support.
        </div>
        <div style={{ textAlign: "right" }}>
          This is a computer-generated invoice.<br />
          Generated on {formatDateTime(new Date().toISOString())}
        </div>
      </div>
    </div>
  );
});
Invoice.displayName = "Invoice";

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: bold ? 14 : 12, fontWeight: bold ? 800 : 500, color: bold ? "#0f172a" : "#475569" }}>
      <span>{label}</span>
      <span style={{ fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}