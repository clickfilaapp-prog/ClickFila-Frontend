import React, { useEffect, useRef, useState } from "react";
import { Clock3, Copy, LoaderCircle, RefreshCw, X } from "lucide-react";
import { getSubscriptionPixQrCode } from "../../services/billing";

const MAX_PIX_ATTEMPTS = 5;
const PIX_RETRY_DELAY = 3000;

function normalizePixData(response) {
  if (!response) return null;
  const pixQrCodeBase64 = response.pixQrCodeBase64 || response.encodedImage;
  const pixCopiaECola = response.pixCopiaECola || response.payload;
  return pixQrCodeBase64 && pixCopiaECola
    ? { ...response, pixQrCodeBase64, pixCopiaECola }
    : null;
}

export default function PixPaymentModal({ pixData, onClose }) {
  const [resolvedPixData, setResolvedPixData] = useState(() =>
    normalizePixData(pixData),
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [loadingPix, setLoadingPix] = useState(!resolvedPixData);
  const [manualRetry, setManualRetry] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (resolvedPixData) return undefined;
    let active = true;
    let timer;

    async function fetchPix() {
      attemptsRef.current += 1;
      try {
        const response = await getSubscriptionPixQrCode();
        if (!active) return;
        const normalized = normalizePixData(response);
        if (normalized) {
          setResolvedPixData(normalized);
          setLoadingPix(false);
          return;
        }
      } catch (requestError) {
        if (!active) return;
        setRetryMessage(requestError.message);
      }

      if (attemptsRef.current >= MAX_PIX_ATTEMPTS) {
        setLoadingPix(false);
        setManualRetry(true);
        return;
      }
      timer = window.setTimeout(fetchPix, PIX_RETRY_DELAY);
    }

    timer = window.setTimeout(fetchPix, PIX_RETRY_DELAY);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [resolvedPixData]);

  async function retryPixManually() {
    setLoadingPix(true);
    setRetryMessage("");
    try {
      const response = await getSubscriptionPixQrCode();
      const normalized = normalizePixData(response);
      if (normalized) {
        setResolvedPixData(normalized);
        setManualRetry(false);
        return;
      }
      setRetryMessage(
        "O banco ainda está processando sua requisição. Aguarde mais uns instantes e tente novamente.",
      );
    } catch (requestError) {
      setRetryMessage(requestError.message);
    } finally {
      setLoadingPix(false);
    }
  }

  async function copyPixCode() {
    try {
      await navigator.clipboard.writeText(resolvedPixData.pixCopiaECola);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(
        "Não foi possível copiar automaticamente. Selecione o código PIX e copie manualmente.",
      );
    }
  }

  return (
    <div className="checkout-modal-backdrop" role="presentation">
      <section
        className="checkout-modal pix-payment-modal pix-payment"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pix-payment-title"
      >
        <button
          className="checkout-close"
          type="button"
          aria-label="Fechar QR Code do PIX"
          onClick={onClose}
        >
          <X />
        </button>
        <div className="pix-waiting">
          <Clock3 />
          <div>
            <h2 id="pix-payment-title">Pagamento via PIX</h2>
            <p>Abra o app do seu banco e use o QR Code ou o código abaixo.</p>
          </div>
        </div>
        {(copyError || retryMessage) && (
          <div className="checkout-alert" role="alert">
            {copyError || retryMessage}
          </div>
        )}
        {resolvedPixData ? (
          <>
            <img
              className="pix-qr-code"
              src={`data:image/png;base64,${resolvedPixData.pixQrCodeBase64}`}
              alt="QR Code para pagamento via PIX"
            />
            <label className="pix-copy-label" htmlFor="pix-modal-copy-code">
              PIX copia e cola
            </label>
            <div className="pix-copy-row">
              <textarea
                id="pix-modal-copy-code"
                value={resolvedPixData.pixCopiaECola}
                readOnly
                rows={3}
              />
              <button
                className="billing-primary"
                type="button"
                onClick={copyPixCode}
              >
                <Copy size={17} /> {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <p className="pix-activation-note">
              A confirmação do pagamento pode levar alguns instantes.
            </p>
          </>
        ) : loadingPix ? (
          <div className="billing-loading" role="status">
            <LoaderCircle className="billing-spinner" /> Gerando seu QR Code...
          </div>
        ) : manualRetry ? (
          <button
            className="billing-primary"
            type="button"
            onClick={retryPixManually}
          >
            <RefreshCw size={17} /> O sistema está lento. Clique aqui para
            buscar o QR Code novamente
          </button>
        ) : null}
      </section>
    </div>
  );
}
