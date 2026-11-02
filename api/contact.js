const MAX_MESSAGE_LENGTH = 300;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ message: "Método não permitido." });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!resendApiKey || !resendFromEmail || !contactEmail) {
    console.error(
      "As variáveis de ambiente do formulário de contato não estão configuradas.",
    );
    return response.status(500).json({
      message: "O suporte está temporariamente indisponível.",
    });
  }

  let body;
  try {
    body =
      typeof request.body === "string"
        ? JSON.parse(request.body || "{}")
        : request.body || {};
  } catch {
    return response.status(400).json({ message: "Dados inválidos." });
  }

  // Campo invisível: robôs costumam preenchê-lo.
  if (body.website) return response.status(200).json({ success: true });

  const name = clean(body.name, 100);
  const email = clean(body.email, 160);
  const company = clean(body.company, 120);
  const phone = clean(body.phone, 30);
  const subject = clean(body.subject, 100).replace(/[\r\n]/g, " ");
  const message = clean(body.message, MAX_MESSAGE_LENGTH);

  if (!name || !email || !subject || !message) {
    return response.status(400).json({
      message: "Preencha os campos obrigatórios.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: "Informe um e-mail válido." });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0b1f3b;line-height:1.5">
      <h2 style="margin-bottom:20px">Novo contato pelo Click Fila</h2>
      <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(company || "Não informada")}</p>
      <p><strong>Telefone:</strong> ${escapeHtml(phone || "Não informado")}</p>
      <div style="margin-top:20px;padding:16px;border-radius:10px;background:#f3f8fb">
        <strong>Mensagem</strong>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [contactEmail],
        reply_to: email,
        subject: `[Click Fila] ${subject}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Falha ao enviar contato pela Resend:", resendError);
      return response.status(502).json({
        message: "Não foi possível enviar sua mensagem. Tente novamente.",
      });
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao acessar a Resend:", error);
    return response.status(502).json({
      message: "Não foi possível enviar sua mensagem. Tente novamente.",
    });
  }
}
