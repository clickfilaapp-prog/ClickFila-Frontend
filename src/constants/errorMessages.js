// src/constants/errorMessages.js

export const ErrorDictionary = {
  // Erros de Negócio (Fluxo esperado / Tratável pelo usuário)
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
  USER_ALREADY_EXISTS: "Já existe uma conta cadastrada com estes dados.",
  ALREADY_IN_QUEUE: "Você já está aguardando nesta fila.",
  QUEUE_CLOSED: "Esta fila está fechada no momento.",
  QUEUE_ALREADY_EXISTS: "Você já possui uma fila de atendimento cadastrada.",
  INVALID_PREFIX: "O prefixo deve conter pelo menos 2 letras ou números.",
  CHAIR_OCCUPIED:
    "Conclua ou cancele o atendimento atual antes de chamar o próximo.",
  SERVICE_IN_PROGRESS:
    "Você não pode cancelar sua posição enquanto está sendo atendido.",
  VALIDATION_ERROR: "Verifique os dados informados e tente novamente.",
  SESSION_NOT_FOUND:
    "A fila solicitada não foi encontrada ou o código é inválido.",

  // Erros de Integração e Sistema (Falhas técnicas genéricas ocultadas do cliente)
  USER_NOT_FOUND: "Erro de sincronização. Por favor, faça login novamente.",
  PROFESSIONAL_NOT_FOUND:
    "Erro ao carregar seu perfil. Contate o suporte se o problema persistir.",
  INVALID_STATUS: "Ação inválida para o momento atual. Recarregue a página.",
  FORBIDDEN:
    "Sua sessão expirou ou você não tem permissão. Faça login novamente.",
  CONCURRENT_MODIFICATION:
    "Os dados foram atualizados por outro dispositivo. Recarregando...",
  MALFORMED_JSON:
    "Ocorreu um erro interno de comunicação. Nossa equipe já foi notificada.",
  TYPE_MISMATCH:
    "Ocorreu um erro interno de comunicação. Nossa equipe já foi notificada.",
  MISSING_PARAMETER:
    "Ocorreu um erro interno de comunicação. Nossa equipe já foi notificada.",
};
