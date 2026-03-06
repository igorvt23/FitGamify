# FitGamify (Expo)

App de gestao de treinos com gamificacao, feito com React Native + Expo para desenvolvimento no Windows e testes no iPhone via Expo Go.

## Requisitos

- Node.js 20+
- npm 10+
- App Expo Go no iPhone

## Rodar localmente

1. Instalar dependencias:
   - `npm install`
2. Subir o app:
   - `npx expo start`
3. Abrir no iPhone:
   - Escaneie o QR Code no terminal/browser com o Expo Go.

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
- Planner semanal: treino diferente por dia/musculo
- Cadastro de exercicios personalizados
- Registro de peso e intensidade
- Alertas locais (lembrete e mensagem motivacional)
- Gamificacao com conquistas
- Dashboard com estatisticas e grafico
- Tema claro/escuro
- PT-BR e EN
- Offline-first com SQLite local
- Login por email/senha (Supabase)
- Backup/restauracao em nuvem por usuario (Supabase)

## Persistencia que nao se perde

Para nao perder dados ao trocar/apagar app:

1. Crie um projeto no Supabase.
2. Rode o SQL de [supabase.sql](d:/ESTUDOS/Projetos/FitGamify/supabase.sql) no SQL Editor.
3. Preencha em [app.json](d:/ESTUDOS/Projetos/FitGamify/app.json):
   - `expo.extra.supabaseUrl`
   - `expo.extra.supabaseAnonKey`
4. No app, faca login em Ajustes e use `Backup agora`.

Sem Supabase, o app continua offline local (SQLite), mas apagar o app apaga os dados locais.
