# FitGamify (Expo)

App de gestão de treinos com gamificação, feito com React Native + Expo para Android, iOS e Web.

## Projeto feito com IA

Este projeto esta sendo desenvolvido inteiramente com inteligencia artificial, de ponta a ponta:

- Imagens com Nano Banana
- Estilo das telas com Figma Make
- Código com Codex

## Requisitos

- Node.js 20 ou 22 LTS (evite Node 24 no Expo CLI)
- npm 10+
- App Expo Go no celular (Android ou iPhone)

## Rodar localmente

1. Criar arquivo de ambiente:
   - `cp .env.example .env` (ou crie manualmente no Windows)
   - Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Instalar dependências:
   - `npm install`
3. Subir o app:
   - `npx expo start`
4. Abrir no celular:
   - Android: escaneie o QR Code no Expo Go ou rode `npm run android`.
   - iPhone: escaneie o QR Code no Expo Go.

## Scripts

- `npm run start` inicia o Expo
- `npm run ios` abre simulador iOS (somente em Mac)
- `npm run android` abre Android
- `npm run web` abre versão web
- `npm run test` roda testes unitários
- `npm run lint` roda lint

## Funcionalidades MVP

- Check-in diário
- Treino do dia com exercícios e imagens (ícone/referência)
- Home no treino do dia
- Sequência de treino em loop (padrao A > B > C), com ordem customizável
- Cadastro de treino por grupo muscular
- Cadastro de exercícios personalizados
- Registro de peso, intensidade e check por exercício
- Séries/repetições variáveis por exercício (ex.: `1x15,2x12,2x8`)
- Alertas locais (lembrete e mensagem motivacional)
- Gamificação com conquistas
- Dashboard com estatísticas, gráfico e mini calendario de histórico
- Tema claro/escuro
- PT-BR e EN
- Offline-first com SQLite local
- Login por email/senha (Supabase)
- Backup/restauração em nuvem por usuario (Supabase)

## Persistência que não se perde

Para não perder dados ao trocar/apagar app:

1. Crie um projeto no Supabase.
2. Rode o SQL de [supabase.sql](d:/ESTUDOS/Projetos/FitGamify/supabase.sql) no SQL Editor.
3. Preencha no `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. No app, faça login em Ajustes e use `Backup agora`.

Sem Supabase, o app continua offline local (SQLite), mas apagar o app apaga os dados locais.

## Rodar sempre e acessar no Android

Este app e offline-first: para abrir e usar no Android instalado, ele não depende de servidor local 24h.
O que precisa ficar online o tempo inteiro, se você usar login/backup, e o Supabase (que ja fica hospedado em nuvem).

### Desenvolvimento no celular (Expo Go)

1. Rode `npx expo start --tunnel`.
2. Abra o app Expo Go no Android.
3. Escaneie o QR code.

Use `--tunnel` quando o celular não consegue acessar sua rede local.

## Gerar e baixar APK no Android

1. Instale EAS CLI:
   - `npm install -g eas-cli`
2. Faca login na Expo:
   - `eas login`
3. Gere APK com o perfil `preview` (ja configurado em [eas.json](d:/ESTUDOS/Projetos/FitGamify/eas.json)):
   - `eas build --platform android --profile preview`
4. Ao terminar, abra o link do build no navegador e baixe o `.apk`.
5. No Android, permita instalação de fontes desconhecidas para o navegador/gerenciador usado.
6. Instale o arquivo APK baixado.

Se quiser publicar na Play Store depois, gere AAB:

- `eas build --platform android --profile production`
