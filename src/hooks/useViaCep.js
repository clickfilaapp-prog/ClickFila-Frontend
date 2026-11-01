import { useEffect, useState } from "react";

export function useViaCep(setValues, setErrors) {
  const [loadingCep, setLoadingCep] = useState(false);

  async function lookupCep(event) {
    const postalCode = String(event?.target?.value || "").replace(/\D/g, "").slice(0, 8);
    if (postalCode.length !== 8) {
      setErrors((current) => ({ ...current, postalCode: "CEP deve conter 8 números." }));
      return;
    }

    setLoadingCep(true);
    setErrors((current) => { const next = { ...current }; delete next.postalCode; return next; });
    try {
      const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`);
      if (!response.ok) throw new Error("CEP não encontrado.");
      const address = await response.json();
      if (address.erro) throw new Error("CEP não encontrado.");
      setValues((current) => ({ ...current, postalCode, address: address.logradouro || "" }));
    } catch {
      setValues((current) => ({ ...current, postalCode: "", address: "" }));
      setErrors((current) => ({ ...current, postalCode: "CEP inválido ou não encontrado." }));
    } finally {
      setLoadingCep(false);
    }
  }

  useEffect(() => {
    const handleLookup = (event) => lookupCep({ target: { value: event.detail } });
    window.addEventListener("billing:lookup-cep", handleLookup);
    return () => window.removeEventListener("billing:lookup-cep", handleLookup);
  });

  return { loadingCep, lookupCep };
}
