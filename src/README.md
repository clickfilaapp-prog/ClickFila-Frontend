# Código-fonte (`src`)

Interface React e integração com o backend do Click Fila.

## Arquivos

- `main.jsx`: monta o React e habilita o roteamento.
- `App.jsx`: renderiza as rotas.
- `styles.css`: estilos globais e responsividade.

## Pastas

- `assets`: imagens da interface.
- `auth`: persistência do JWT e da role.
- `components`: partes realmente reutilizáveis da interface.
- `pages`: páginas completas, seus estados e suas ações.
- `routes`: URLs e registro das páginas.
- `services`: funções que acessam os endpoints.

Os arquivos `index.js` funcionam como entradas públicas de cada módulo, evitando imports acoplados à estrutura interna. As páginas coordenam estado, chamadas e suas funções auxiliares; os blocos visuais ficam em subpastas de `components`.

Dados de usuário, fila e atendimento devem vir do backend; não são simulados no frontend.
