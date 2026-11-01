// src/constants/errorMessages.js

const GENERIC_SYSTEM_ERROR = "Ocorreu um erro interno de comunicação. Nossa equipe já foi notificada.";

export const ErrorDictionary = {
  // =========================================================================
  // Erros de Empresa e Negócio (Fluxo esperado / Tratável pelo usuário)
  // =========================================================================
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
  INVALID_OTP: "O código informado é inválido. Confira e tente novamente.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail para realizar esta ação.",
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
  BUSINESS_ALREADY_EXISTS: "Você já possui uma empresa cadastrada.",
  BUSINESS_INACTIVE: "O perfil desta empresa encontra-se inativo no momento.",
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
  OWNER_CANNOT_LEAVE: "O dono não pode sair da equipe. Transfira a titularidade ou desative a empresa.",
  PASSWORDS_DO_NOT_MATCH: "As senhas informadas não coincidem.",
  CANNOT_MANAGE_OTHER_MEMBER: "Você não tem permissão para realizar ações em nome de outro profissional.",
  CANNOT_MANAGE_OTHER_CLIENT: "Você só pode gerenciar os clientes que você mesmo chamou para atendimento.",
  NOT_BUSINESS_MEMBER: "Você não faz parte da equipe desta barbearia.",
  CANCEL_NOT_ALLOWED: "Apenas o dono da barbearia ou o profissional que chamou o cliente podem cancelar este atendimento.",
  OWNER_ONLY_ACTION: "Apenas o dono da barbearia tem permissão para realizar esta ação.",
  ALREADY_CANCELED: "Esta assinatura já foi cancelada anteriormente.",
  ALREADY_VERIFIED: "Esta conta já foi verificada.",
  BUSINESS_ALREADY_ACTIVE: "Esta empresa já se encontra ativa no momento.",
  INVALID_CODE: "O código informado é inválido. Verifique e tente novamente.",
  LGPD_PENDING: "É necessário aceitar os termos de uso e política de privacidade para continuar.",
  MISSING_DOCUMENT: "Informe um CPF ou CNPJ válido para continuar.",
  PAYMENT_REJECTED: "O pagamento foi recusado pelo cartão ou banco. Verifique os dados e tente novamente.",
  QUEUE_EMPTY: "Não há clientes aguardando na fila no momento.",
  
  // ---> ERROS DE PAGAMENTO E ASSINATURA ADICIONADOS <---
  INVALID_CARD: "Os dados do cartão de crédito são inválidos ou foram rejeitados pela operadora.",
  INVALID_PAYMENT_METHOD: "O método de pagamento selecionado não é suportado.",
  PAYMENT_METHOD_DENIED: "Você não tem permissão para utilizar este método de pagamento.",
  PIX_NOT_ALLOWED: "Não foi possível gerar o PIX para esta cobrança específica.",
  SAME_PLAN: "Sua empresa já está inscrita neste plano.",
  SUBSCRIPTION_ALREADY_EXISTS: "Você já possui uma assinatura ativa. Utilize a opção de atualizar pagamento.",

  // =========================================================================
  // Erros de Integração e Sistema (Falhas de sincronização / Dados não encontrados)
  // =========================================================================
  USER_NOT_FOUND: "Erro de sincronização. Por favor, faça login novamente.",
  PROFESSIONAL_NOT_FOUND: "Erro ao carregar seu perfil. Contate o suporte se o problema persistir.",
  INVALID_STATUS: "Ação inválida para o momento atual. Recarregue a página e tente novamente.",
  FORBIDDEN: "Sua sessão expirou ou você não tem permissão. Faça login novamente.",
  UNAUTHORIZED: "Sua sessão expirou ou você não tem permissão. Faça login novamente.",
  REFRESH_TOKEN_EXPIRED: "Sua sessão expirou ou você não tem permissão. Faça login novamente.",
  CONCURRENT_MODIFICATION: "Os dados foram atualizados por outro dispositivo. Recarregando...",
  INVALID_REFRESH_TOKEN: "Sua sessão expirou. Faça login novamente.",
  ENTRY_NOT_FOUND: "Registro não encontrado na fila. A fila pode ter sido atualizada.",
  BUSINESS_NOT_FOUND: "Perfil da empresa não encontrado. Recarregue a página.",
  INVITE_NOT_FOUND: "O convite solicitado não foi encontrado no sistema.",
  MEMBER_NOT_FOUND: "Profissional não encontrado na base de dados.",
  OWNER_NOT_FOUND: "Dados do proprietário não encontrados. Contate o suporte.",
  TEAM_MEMBER_NOT_FOUND: "Vínculo com a equipe não encontrado.",
  PLAN_NOT_FOUND: "O plano selecionado não está mais disponível.",
  SUBSCRIPTION_NOT_FOUND: "Não foi possível localizar os dados da sua assinatura.",
  INVALID_SUBSCRIPTION: "Sua assinatura atual é inválida para realizar esta ação.",
  PAYMENT_METHOD_NOT_FOUND: "O método de pagamento selecionado não foi encontrado.",

  // =========================================================================
  // Erros Técnicos Mascarados (Ocultos do usuário final)
  // =========================================================================
  ACCESS_DENIED: GENERIC_SYSTEM_ERROR,
  TOKEN_GENERATION_ERROR: GENERIC_SYSTEM_ERROR,
  MALFORMED_JSON: GENERIC_SYSTEM_ERROR,
  TYPE_MISMATCH: GENERIC_SYSTEM_ERROR,
  MISSING_PARAMETER: GENERIC_SYSTEM_ERROR,
  GATEWAY_ERROR: GENERIC_SYSTEM_ERROR,       
  INVALID_STATE: GENERIC_SYSTEM_ERROR,  
  UNSUPPORTED_CYCLE: GENERIC_SYSTEM_ERROR,
  MISSING_PAYMENT_DATA: GENERIC_SYSTEM_ERROR
};