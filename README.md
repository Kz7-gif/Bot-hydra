# Bot de Tickets e Apoio Pix (Discord)

Este é um bot completo para o Discord, desenvolvido em Node.js com a biblioteca `discord.js`. Ele inclui um sistema de tickets profissional (baseado em menus de seleção) e um painel de apoio via Pix.

## 🚀 Funcionalidades

- **`/painel`**: Envia o painel de atendimento com as categorias:
  - ❓ **Dúvidas**: Abre um ticket privado para suporte geral.
  - 🍓 **Reportar Grif**: Abre um ticket privado para denúncias.
  - 🔒 **Desbloquear Contas**: Categoria configurada como indisponível (conforme solicitado).
- **`/painelpx`**: Gera um painel de apoio ao projeto com chave Pix configurável.
- **Sistema de Tickets**: Cria canais privados automaticamente, visíveis apenas para o usuário e a equipe (Staff).
- **Fechamento de Tickets**: Botão dentro do ticket para fechar e deletar o canal após 5 segundos.

## 🛠️ Configuração Inicial

1.  Crie um bot no [Discord Developer Portal](https://discord.com/developers/applications).
2.  Em **Bot**, ative as "Privileged Gateway Intents":
    - `Presence Intent`
    - `Server Members Intent`
    - `Message Content Intent`
3.  Convide o bot para seu servidor com as permissões de `Administrator`.

## 📦 Como Hospedar no Railway

1.  Crie uma conta no [Railway.app](https://railway.app/).
2.  Crie um novo projeto e selecione "Deploy from GitHub repo" (ou suba os arquivos diretamente).
3.  Nas **Variables** do seu projeto no Railway, adicione as seguintes variáveis:
    - `DISCORD_TOKEN`: O token do seu bot.
    - `PIX_KEY`: Sua chave Pix para receber apoios.
    - `PIX_NAME`: Seu nome completo (para o Pix).
    - `PIX_CITY`: Sua cidade (para o Pix).
    - `STAFF_ROLE_ID`: (Opcional) O ID do cargo da sua equipe para eles verem os tickets.

## 🖥️ Execução Local

Se quiser testar no seu computador:
1. Instale o [Node.js](https://nodejs.org/).
2. No terminal, dentro da pasta do bot, rode:
   ```bash
   npm install
   ```
3. Renomeie o arquivo `.env.example` para `.env` e preencha seus dados.
4. Inicie o bot:
   ```bash
   npm start
   ```

---
*Desenvolvido com ❤️ para facilitar a gestão do seu servidor.*
