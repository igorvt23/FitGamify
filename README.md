# FitGamify (Expo)

App de gestao de treinos com gamificacao, feito com React Native + Expo para Android, iOS e Web.

## Requisitos

- Node.js 20 ou 22 LTS (evite Node 24 no Expo CLI)
- npm 10+
- App Expo Go no celular (Android ou iPhone)

## Rodar localmente

1. Criar arquivo de ambiente:
   - `cp .env.example .env` (ou crie manualmente no Windows)
   - Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Instalar dependencias:
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
- `npm run web` abre versao web
- `npm run test` roda testes unitarios
- `npm run lint` roda lint

## Funcionalidades MVP

- Check-in diario
- Treino do dia com exercicios e imagens (icone/referencia)
- Home no treino do dia
- Sequencia de treino em loop (padrao A > B > C), com ordem customizavel
- Cadastro de treino por grupo muscular
- Cadastro de exercicios personalizados
- Registro de peso, intensidade e check por exercicio
- Series/repeticoes variaveis por exercicio (ex.: `1x15,2x12,2x8`)
- Alertas locais (lembrete e mensagem motivacional)
- Gamificacao com conquistas
- Dashboard com estatisticas, grafico e mini calendario de historico
- Tema claro/escuro
- PT-BR e EN
- Offline-first com SQLite local
- Login por email/senha (Supabase)
- Backup/restauracao em nuvem por usuario (Supabase)

## Persistencia que nao se perde

Para nao perder dados ao trocar/apagar app:

1. Crie um projeto no Supabase.
2. Rode o SQL de [supabase.sql](d:/ESTUDOS/Projetos/FitGamify/supabase.sql) no SQL Editor.
3. Preencha no `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. No app, faca login em Ajustes e use `Backup agora`.

Sem Supabase, o app continua offline local (SQLite), mas apagar o app apaga os dados locais.

## Subir o servidor (para acessar depois)

O app usa Supabase como backend (auth + backup). Para deixar em producao:

1. Crie um projeto no Supabase.
2. Execute [supabase.sql](d:/ESTUDOS/Projetos/FitGamify/supabase.sql).
3. No Supabase Dashboard, copie:
   - Project URL
   - anon public key
4. Configure no `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Gere build Android para uso continuo:
   - `npx eas build -p android`
6. Instale o APK/AAB no seu celular e use login + backup.

Com isso, seus dados ficam no Supabase e podem ser restaurados depois em qualquer dispositivo.
