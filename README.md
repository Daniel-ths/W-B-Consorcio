🚀 W-B Consórcio

Aplicação web desenvolvida com Next.js 14, React 18, TypeScript e Tailwind CSS, focada em simulação, consulta e gestão de consórcios, incluindo autenticação, consulta de CPF e envio de SMS.

📌 Visão Geral

O projeto é dividido em duas grandes áreas:

Área pública (site): simulações, catálogo e páginas institucionais
Área privada (admin/vendedor): acesso autenticado com funcionalidades restritas

Além disso, conta com:

Integração com Supabase para autenticação
APIs internas para consulta de CPF e envio de SMS
Middleware para controle de acesso
🧱 Tecnologias Utilizadas
Next.js 14 (App Router)
React 18
TypeScript
Tailwind CSS
Supabase (Auth + backend)
Netlify (deploy)
📂 Estrutura do Projeto
├── app/
├── components/
├── contexts/
├── lib/
├── public/
├── middleware.ts
├── next.config.js
├── package.json
└── README.md
📁 Explicação das Pastas e Arquivos
🔹 app/

Responsável pelas rotas da aplicação (App Router do Next.js).

Estrutura:
app/(site)/ → páginas públicas (home, simulador, catálogo)
app/admin/ → área administrativa
app/vendedor/ → área do vendedor
app/api/ → rotas de API (backend interno)
Exemplos:
app/api/consultar-cpf/route.ts
API que consulta dados de CPF via serviço externo
app/api/sms/enviar/route.ts
API responsável por envio de SMS
🔹 components/

Componentes reutilizáveis da interface.

Exemplos:

Botões
Cards de veículos
Inputs
Layouts visuais

📌 Função: manter UI desacoplada da lógica

🔹 contexts/
AuthContext.tsx

Gerencia autenticação no client:

Obtém sessão do usuário
Escuta mudanças de login/logout
Disponibiliza usuário globalmente
supabase.auth.getSession()
supabase.auth.onAuthStateChange()

📌 Evita passar props manualmente entre componentes

🔹 lib/

Contém integrações e utilitários:

supabase.ts → configuração do client
helpers e funções auxiliares

📌 Centraliza lógica externa (APIs, serviços)

🔹 middleware.ts

Controla acesso às rotas:

Bloqueia páginas privadas sem login
Redireciona usuários autenticados
Protege /admin e /vendedor

📌 Executado antes das páginas carregarem

🔹 next.config.js

Configuração do Next.js

⚠️ IMPORTANTE:

eslint.ignoreDuringBuilds = true
typescript.ignoreBuildErrors = true

👉 Isso permite build mesmo com erros
👉 Recomendado remover em produção

🔹 .env.local

Arquivo de variáveis de ambiente:

Exemplo:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMS_API_KEY=

⚠️ Nunca deve ser versionado no Git

🔐 Autenticação

Feita com Supabase:

Login via client
Sessão mantida no contexto
Middleware valida acesso no server
🔌 APIs Internas
📌 /api/consultar-cpf

Função:

Consulta dados de CPF em API externa

Recursos:

Validação de CPF
Timeout de requisição
Controle simples de repetição (cooldown)

⚠️ Limitação:

Usa memória local → não funciona bem em escala
📌 /api/sms/enviar

Função:

Enviar SMS via serviço externo

Recursos:

Validação de número e mensagem
Integração com API de SMS

⚠️ Atenção:

Pode expor detalhes de erro
Precisa proteção contra abuso
🧠 Fluxo da Aplicação
Usuário acessa site público
Faz login (Supabase)
Middleware valida acesso
Context mantém sessão
APIs são chamadas via frontend
⚠️ Pontos Críticos (IMPORTANTE)
🔴 Segurança
.env.local não deve estar no repositório
APIs não possuem autenticação forte
Falta rate limiting real
Middleware não diferencia papéis (admin/vendedor)
🟡 Build
Erros de TypeScript e ESLint são ignorados
Pode gerar deploy com código quebrado
🟠 Escalabilidade
Controle de requisições usa memória local (Map)
Não funciona em ambiente serverless distribuído
🔵 Código
Falta padronização de erros
Falta logs estruturados
Algumas respostas expõem dados internos
🧪 Testes

Atualmente não há testes automatizados.

👉 Recomendado adicionar:

Testes de API
Testes de autenticação
Testes de integração
▶️ Como Rodar o Projeto
# instalar dependências
npm install

# rodar em desenvolvimento
npm run dev

Acesse:

http://localhost:3000
🚀 Deploy

Configurado para Netlify

npm run build
📈 Melhorias Recomendadas
 Remover .env.local do Git
 Ativar validação de build (TS + ESLint)
 Implementar autenticação nas APIs
 Adicionar rate limiting (Redis / Upstash)
 Criar sistema de roles (admin/vendedor)
 Adicionar testes automatizados
 Melhorar tratamento de erros
 Documentar variáveis de ambiente
📄 Licença

Uso interno / privado

👨‍💻 Autor

Projeto desenvolvido por Daniel Miranda