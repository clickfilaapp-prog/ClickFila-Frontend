# Código-fonte (`src`)

Interface React e integração com o backend do Click Fila.

## Arquivos

- `main.jsx`: monta o React, habilita o roteamento e compõe os recursos globais.
- `styles.css`: estilos globais e responsividade.

## Pastas

- `assets`: imagens da interface.
- `auth`: persistência do JWT e da role.
- `components`: partes realmente reutilizáveis da interface.
- `pages`: páginas completas, seus estados e suas ações.
- `routes`: URLs e registro das páginas.
- `services`: funções que acessam os endpoints.

Os arquivos `index.js` funcionam como entradas públicas de cada módulo, evitando imports acoplados à estrutura interna. As páginas coordenam estado, chamadas e suas funções auxiliares; os blocos visuais ficam em subpastas de `components`.

O componente `LgpdConsentGate.jsx` concentra exclusivamente o fluxo global de consentimento LGPD.

Dados de usuário, fila e atendimento devem vir do backend; não são simulados no frontend.
