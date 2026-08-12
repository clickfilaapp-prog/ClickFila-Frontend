# Páginas

Cada página concentra sua visualização, seus estados e suas ações.

## Arquivos

- `Login.jsx`: autentica pelo service e salva JWT e role.
- `RoleChoice.jsx`: escolha do tipo de cadastro.
- `ClientRegister.jsx`: chama o endpoint de cadastro do cliente.
- `ProfessionalRegister.jsx`: chama o endpoint de cadastro profissional.
- `ClientQueue.jsx`: coordena estado, socket e ações do cliente; sua interface é dividida em `components/clientQueue`.
- `ProfessionalDashboard.jsx`: coordena estado e ações profissionais; sua interface é dividida em `components/professionalDashboard`.
- `index.js`: entrada pública das páginas para o módulo de rotas.

Os blocos de interface ficam em `components`, agrupados pelo fluxo ao qual pertencem.
