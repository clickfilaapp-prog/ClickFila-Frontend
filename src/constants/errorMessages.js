// src/constants/errorMessages.js

const GENERIC_SYSTEM_ERROR = "Ocorreu um erro interno de comunicação. Nossa equipe já foi notificada.";

export const ErrorDictionary = {
  // =========================================================================
  // Erros de Negócio (Fluxo esperado / Tratável pelo usuário)
  // =========================================================================
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
  USER_ALREADY_EXISTS: "Já existe uma conta cadastrada com estes dados.",
  ALREADY_IN_QUEUE: "Você já está aguardando nesta fila.",
  QUEUE_CLOSED: "Esta fila está fechada no momento.",
  QUEUE_ALREADY_EXISTS: "Você já possui uma fila de atendimento cadastrada.",
  INVALID_PREFIX: "O prefixo deve conter pelo menos 2 letras ou números.",
  CHAIR_OCCUPIED: "Conclua ou cancele o atendimento atual antes de chamar o próximo.",
  SERVICE_IN_PROGRESS: "Você não pode cancelar sua posição enquanto está sendo atendido.",
  VALIDATION_ERROR: "Verifique os dados informados e tente novamente.",
  SESSION_NOT_FOUND: "A fila solicitada não foi encontrada ou o código é inválido.",
  QUEUE_IS_ACTIVE: "Feche a fila antes de alterar sua conta para cliente.",
  MEMBER_BUSY: "Finalize ou cancele o cliente chamado ou em atendimento antes de alterar sua conta.",
  ALREADY_CLIENT: "Sua conta já é do tipo cliente.",
  ALREADY_PROFESSIONAL: "Sua conta já é do tipo profissional.",
  ACCOUNT_DEACTIVATED: "Sua conta foi desativada. Entre em contato com o suporte.",
  ACTIVE_QUEUE_SESSION: "Feche a fila de atendimento atual antes de realizar esta ação.",
  ALREADY_ACTIVE: "Este registro já se encontra ativo no momento.",
  ALREADY_DELETED: "Este registro já foi excluído anteriormente.",
  ALREADY_IN_TEAM: "Este profissional já faz parte da sua equipe.",
  BUSINESS_ALREADY_EXISTS: "Você já possui um negócio cadastrado.",
  BUSINESS_INACTIVE: "O perfil deste negócio encontra-se inativo no momento.",
  CANNOT_REMOVE_OWNER: "Não é possível remover o proprietário da equipe.",
  CLIENTS_STILL_IN_QUEUE: "Ainda existem clientes na fila ou em atendimento. Finalize a fila primeiro.",
  ENTRY_NOT_IN_ACTIVE_QUEUE: "Você não está mais na fila de atendimento ativa.",
  EXPIRED_CODE: "O código informado expirou. Solicite um novo.",
  INVALID_CURRENT_PASSWORD: "A senha atual informada está incorreta.",
  INVALID_INVITE: "O convite é inválido ou não existe mais.",
  INVITE_ALREADY_SENT: "Já existe um convite pendente para este e-mail.",
  INVITE_EXPIRED: "Este convite já expirou. Solicite um novo envio.",
  MEMBER_INACTIVE: "Este membro da equipe encontra-se inativo.",
  MEMBER_IN_ACTIVE_SERVICE: "Este profissional está no meio de um atendimento ativo.",
  OWNER_CANNOT_LEAVE: "O dono não pode sair da equipe. Transfira a titularidade ou desative o negócio.",
  PASSWORDS_DO_NOT_MATCH: "As senhas informadas não coincidem.",

  // =========================================================================
  // Erros de Integração e Sistema (Falhas técnicas genéricas ocultadas do cliente)
  // =========================================================================
  USER_NOT_FOUND: "Erro de sincronização. Por favor, faça login novamente.",
  PROFESSIONAL_NOT_FOUND: "Erro ao carregar seu perfil. Contate o suporte se o problema persistir.",
  INVALID_STATUS: "Ação inválida para o momento atual. Recarregue a página.",
  FORBIDDEN: "Sua sessão expirou ou você não tem permissão. Faça login novamente.",
  UNAUTHORIZED: "Sua sessão expirou ou você não tem permissão. Faça login novamente.",
  REFRESH_TOKEN_EXPIRED: "Sua sessão expirou ou você não tem permissão. Faça login novamente.",
  CONCURRENT_MODIFICATION: "Os dados foram atualizados por outro dispositivo. Recarregando...",
  
  // Mascarando falhas de código puro com a mensagem genérica que você definiu:
  ACCESS_DENIED: GENERIC_SYSTEM_ERROR,
  TOKEN_GENERATION_ERROR: GENERIC_SYSTEM_ERROR,
  MALFORMED_JSON: GENERIC_SYSTEM_ERROR,
  TYPE_MISMATCH: GENERIC_SYSTEM_ERROR,
  MISSING_PARAMETER: GENERIC_SYSTEM_ERROR,
};