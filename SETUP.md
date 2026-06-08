# Setup do App — Passo a Passo

## 1. Supabase (banco de dados grátis)

1. Acesse https://supabase.com e clique em **Start your project** → crie conta com Google
2. Crie um novo projeto (escolha a região **South America (São Paulo)**)
3. Aguarde ~2 minutos o projeto inicializar
4. Vá em **SQL Editor** (menu esquerdo) e cole o conteúdo do arquivo `supabase-schema.sql`
5. Clique em **Run** para criar as tabelas
6. Vá em **Settings → API** e copie:
   - `Project URL` → coloque em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → coloque em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → coloque em `SUPABASE_SERVICE_ROLE_KEY`

## 2. Z-API (WhatsApp)

1. Acesse https://www.z-api.io e crie conta
2. Crie uma nova instância → escaneie o QR Code com seu WhatsApp
3. Copie o **Instance ID** e o **Token**
4. Vá em **Security** e copie o **Client-Token**
5. Preencha no `.env.local`:
   - `ZAPI_INSTANCE_ID` = ID da instância
   - `ZAPI_TOKEN` = Token
   - `ZAPI_CLIENT_TOKEN` = Client Token
   - `WHATSAPP_NUMBER` = seu número com DDI (ex: 5511999999999)

## 3. Vercel (deploy grátis)

1. Acesse https://vercel.com e crie conta com GitHub
2. Faça upload do projeto (ou conecte via GitHub)
3. Em **Environment Variables** adicione todas as variáveis do `.env.local`
4. Deploy!

## 4. Relatório automático no WhatsApp

Após o deploy, configure um cron job gratuito em https://cron-job.org:
- URL: `https://seu-app.vercel.app/api/relatorio`
- Método: POST
- Header: `Authorization: Bearer SUA_CRON_SECRET`
- Horário: todo dia às 20:00

## 5. Instalar no celular como app

**iPhone:** Abra no Safari → botão de compartilhar → "Adicionar à Tela de Início"
**Android:** Abra no Chrome → menu (3 pontos) → "Adicionar à tela inicial"

## 6. Variáveis de ambiente (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ZAPI_INSTANCE_ID=xxxx
ZAPI_TOKEN=xxxx
ZAPI_CLIENT_TOKEN=xxxx
WHATSAPP_NUMBER=5511999999999
CRON_SECRET=escolha_uma_senha_qualquer
```
