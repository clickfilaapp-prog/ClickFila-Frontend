# Rotas

As rotas de navegação são declaradas em `AppRoutes.jsx`. Os endpoints do backend ficam isolados em `apiRoutes.js`, evitando que os services dependam de um componente React.

O arquivo `index.js` é a entrada pública do módulo.

O frontend usa a role retornada no login apenas para escolher a página inicial. O backend valida a autorização de cada operação.
