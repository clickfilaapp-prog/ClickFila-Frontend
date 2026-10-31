import React, { useState } from "react";
import { Clock3, Copy, X } from "lucide-react";

export default function PixPaymentModal({ pixData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  async function copyPixCode() {
    try {
      await navigator.clipboard.writeText(pixData.pixCopiaECola);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError("Não foi possível copiar automaticamente. Selecione o código PIX e copie manualmente.");
    }
  }

  return <div className="checkout-modal-backdrop" role="presentation">
    <section className="checkout-modal pix-payment-modal pix-payment" role="dialog" aria-modal="true" aria-labelledby="pix-payment-title">
      <button className="checkout-close" type="button" aria-label="Fechar QR Code do PIX" onClick={onClose}><X /></button>
      <div className="pix-waiting"><Clock3 /><div><h2 id="pix-payment-title">Aguardando pagamento...</h2><p>Abra o app do seu banco, pague o PIX e aguarde a confirmação.</p></div></div>
      {copyError && <div className="checkout-alert" role="alert">{copyError}</div>}
      <img className="pix-qr-code" src={`data:image/png;base64,${pixData.pixQrCodeBase64}`} alt="QR Code para pagamento via PIX" />
      <label className="pix-copy-label" htmlFor="pix-modal-copy-code">PIX copia e cola</label>
      <div className="pix-copy-row"><textarea id="pix-modal-copy-code" value={pixData.pixCopiaECola} readOnly rows={3} /><button className="billing-primary" type="button" onClick={copyPixCode}><Copy size={17} /> {copied ? "Copiado!" : "Copiar"}</button></div>
      <p className="pix-activation-note">Seu acesso será liberado automaticamente após a confirmação do pagamento.</p>
    </section>
  </div>;
}
