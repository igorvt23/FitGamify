export const translations = {
  "pt-BR": {
    tab: {
      workout: "Treino",
      plans: "Planos",
      dashboard: "Dashboard",
      achievements: "Conquistas",
      settings: "Ajustes"
    },
    workout: {
      title: "Treino do Dia",
      create: "Criar treino de hoje",
      checkin: "Check-in diario",
      checkedin: "Check-in feito",
      dayOverview: "Resumo do dia",
      totalSessions: "Treinos hoje",
      sessionLabel: "Sessao",
      addAnother: "Adicionar outro treino",
      addSequenceWorkout: "Adicionar proximo treino da sequencia",
      noMoreTemplatesToday: "Nenhum outro treino disponivel para hoje.",
      scheduleMode: "Formato",
      plannedWeight: "Peso cadastrado",
      currentWeight: "Peso atual",
      proposedSeries: "Series propostas",
      set: "Serie",
      targetReps: "Reps alvo",
      actualReps: "Reps feitas",
      difficultyLabel: "Dificuldade",
      difficulty: {
        easy: "Tranquilo",
        medium: "Medio",
        hard: "Dificil"
      },
      saveExercise: "Salvar exercicio",
      markDone: "Marcar concluido",
      doneLabel: "Concluido",
      completedSets: "Series preenchidas",
      todayPlan: "Plano de hoje",
      muscleGroup: "Grupo muscular",
      totalVolume: "Volume total",
      intensityAvg: "Intensidade media",
      weight: "Peso",
      intensity: "Intensidade",
      completedExercises: "Exercicios concluidos"
    },
    plans: {
      title: "Planejador",
      modeTitle: "Formato dos treinos",
      modeHint: "Voce pode usar sequencia rotativa ou montar os treinos por dia da semana.",
      modeSequence: "Sequencial",
      modeWeekday: "Dia da semana",
      sequenceTitle: "Sequencia de treinos",
      sequenceHint: "A ordem roda em loop (ex.: A > B > C > A).",
      weekdayTitle: "Treinos por dia da semana",
      weekdayHint: "Voce pode vincular mais de um treino ao mesmo dia.",
      newTemplate: "Novo treino da sequencia",
      editTemplate: "Editar treino selecionado",
      templateName: "Nome do treino",
      muscleGroup: "Grupo muscular",
      day: "Dia",
      assignedDays: "Dias atribuidos",
      noAssignedDays: "Sem dias definidos",
      multiPerDayHint: "Marque o mesmo dia em varios treinos para permitir mais de um treino por dia.",
      sequenceMultiHint: "No modo sequencial, voce pode adicionar mais sessoes no mesmo dia pela tela de treino.",
      exerciseName: "Nome do exercicio",
      repScheme: "Esquema (ex: 1x15,2x12,2x8)",
      defaultWeightKg: "Peso padrao (kg)",
      addExerciseToTemplate: "Adicionar exercicio ao treino",
      addExerciseInline: "Adicionar exercicio",
      saveTemplateMeta: "Salvar treino",
      deleteTemplate: "Apagar treino",
      saveExerciseRow: "Salvar exercicio",
      deleteExerciseRow: "Apagar exercicio",
      saveTemplate: "Salvar treino na sequencia",
      currentTemplates: "Treinos configurados",
      noTemplates: "Nenhum treino configurado ainda.",
      newExercise: "Novo exercicio",
      saveExercise: "Salvar exercicio",
      exerciseLibrary: "Biblioteca de exercicios",
      noExercises: "Sem exercicios cadastrados.",
      defaultName: "Treino",
      defaultMuscle: "Geral",
      defaultExercise: "Exercicio livre",
      weekday: {
        sunday: "Domingo",
        monday: "Segunda",
        tuesday: "Terca",
        wednesday: "Quarta",
        thursday: "Quinta",
        friday: "Sexta",
        saturday: "Sabado"
      }
    },
    dashboard: {
      title: "Dashboard",
      totalCompleted: "Treinos concluidos",
      streak: "Streak atual",
      achievements: "Conquistas",
      empty: "Sem treinos concluidos ainda.",
      calendarTitle: "Historico no calendario",
      selectedDate: "Dia selecionado",
      noSessionOnDay: "Nenhum treino concluido nesse dia.",
      done: "feito",
      pending: "pendente",
      weightIncreased: "Peso aumentado neste treino",
      weightSameOrLower: "Peso mantido ou abaixo do cadastrado"
    },
    achievement: {
      title: "Conquistas",
      empty: "Sem conquistas por enquanto.",
      first: {
        title: "Primeiro check-in",
        detail: "Voce concluiu seu primeiro treino."
      },
      streak3: {
        title: "Streak de 3 dias",
        detail: "Voce treinou por 3 dias seguidos."
      },
      streak7: {
        title: "Streak de 7 dias",
        detail: "Uma semana completa sem quebrar ritmo."
      },
      workout10: {
        title: "10 treinos",
        detail: "Voce chegou a 10 treinos concluidos."
      }
    },
    settings: {
      title: "Ajustes",
      themeLabel: "Tema",
      theme: {
        light: "Claro",
        dark: "Escuro",
        system: "Sistema"
      },
      language: "Idioma",
      login: "Login da conta",
      logout: "Sair",
      email: "Email",
      password: "Senha",
      signin: "Entrar",
      createAccount: "Criar conta",
      current: "Atual",
      cloudSync: "Sincronizacao em nuvem",
      backupNow: "Backup agora",
      restoreNow: "Restaurar backup",
      cloudHint: "Use Supabase para guardar dados e recuperar em outro celular.",
      authSuccess: "Login realizado.",
      authError: "Falha na autenticacao.",
      signupSuccess: "Conta criada. Verifique seu email para confirmar.",
      backupSuccess: "Backup concluido com sucesso.",
      backupError: "Falha ao sincronizar com nuvem.",
      restoreSuccess: "Backup restaurado com sucesso.",
      errors: "Logs de erro",
      noErrors: "Sem erros registrados."
    },
    signup: {
      title: "Criar conta",
      fullName: "Nome",
      age: "Idade",
      heightCm: "Altura (cm)",
      weightKg: "Peso (kg)",
      email: "Email",
      phone: "Celular",
      password: "Senha",
      createAccount: "Finalizar cadastro",
      successTitle: "Conta criada",
      successDesc: "Conta criada. Verifique seu email para confirmar e depois faca login.",
      error: "Erro no cadastro",
      fillAll: "Preencha todos os campos.",
      genericError: "Nao foi possivel criar conta."
    },
    auth: {
      loggedInAs: "Logado como",
      loginLocal: "Entrar local"
    },
    notification: {
      reminder: {
        title: "Lembrete de treino",
        body: "Seu treino de hoje esta pendente."
      },
      motivation: {
        title: "Continue firme",
        body1: "Disciplina vence motivacao.",
        body2: "Mais uma sessao e voce avanca.",
        body3: "Consistencia gera resultado."
      }
    }
  },
  en: {
    tab: {
      workout: "Workout",
      plans: "Plans",
      dashboard: "Dashboard",
      achievements: "Achievements",
      settings: "Settings"
    },
    workout: {
      title: "Today's Workout",
      create: "Create today's workout",
      checkin: "Daily check-in",
      checkedin: "Checked in",
      dayOverview: "Day overview",
      totalSessions: "Workouts today",
      sessionLabel: "Session",
      addAnother: "Add another workout",
      addSequenceWorkout: "Add next sequence workout",
      noMoreTemplatesToday: "No additional workout available for today.",
      scheduleMode: "Format",
      plannedWeight: "Saved weight",
      currentWeight: "Current weight",
      proposedSeries: "Planned sets",
      set: "Set",
      targetReps: "Target reps",
      actualReps: "Actual reps",
      difficultyLabel: "Difficulty",
      difficulty: {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard"
      },
      saveExercise: "Save exercise",
      markDone: "Mark done",
      doneLabel: "Completed",
      completedSets: "Sets filled",
      todayPlan: "Today's plan",
      muscleGroup: "Muscle group",
      totalVolume: "Total volume",
      intensityAvg: "Average intensity",
      weight: "Weight",
      intensity: "Intensity",
      completedExercises: "Completed exercises"
    },
    plans: {
      title: "Planner",
      modeTitle: "Workout format",
      modeHint: "You can use a rotating sequence or organize workouts by weekday.",
      modeSequence: "Sequential",
      modeWeekday: "Weekday",
      sequenceTitle: "Workout sequence",
      sequenceHint: "The order runs in a loop (e.g. A > B > C > A).",
      weekdayTitle: "Weekday workouts",
      weekdayHint: "You can assign more than one workout to the same day.",
      newTemplate: "New sequence workout",
      editTemplate: "Edit selected workout",
      templateName: "Workout name",
      muscleGroup: "Muscle group",
      day: "Day",
      assignedDays: "Assigned days",
      noAssignedDays: "No assigned days",
      multiPerDayHint: "Assign the same day to multiple templates to allow more than one workout per day.",
      sequenceMultiHint: "In sequential mode, you can add extra sessions from the workout screen.",
      exerciseName: "Exercise name",
      repScheme: "Scheme (e.g. 1x15,2x12,2x8)",
      defaultWeightKg: "Default weight (kg)",
      addExerciseToTemplate: "Add exercise to workout",
      addExerciseInline: "Add exercise",
      saveTemplateMeta: "Save workout",
      deleteTemplate: "Delete workout",
      saveExerciseRow: "Save exercise",
      deleteExerciseRow: "Delete exercise",
      saveTemplate: "Save sequence workout",
      currentTemplates: "Configured workouts",
      noTemplates: "No configured workouts yet.",
      newExercise: "New exercise",
      saveExercise: "Save exercise",
      exerciseLibrary: "Exercise library",
      noExercises: "No exercises created yet.",
      defaultName: "Workout",
      defaultMuscle: "General",
      defaultExercise: "Custom exercise",
      weekday: {
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday"
      }
    },
    dashboard: {
      title: "Dashboard",
      totalCompleted: "Completed workouts",
      streak: "Current streak",
      achievements: "Achievements",
      empty: "No completed workouts yet.",
      calendarTitle: "Calendar history",
      selectedDate: "Selected day",
      noSessionOnDay: "No completed workout on this day.",
      done: "done",
      pending: "pending",
      weightIncreased: "Weight increased in this workout",
      weightSameOrLower: "Weight kept or below saved weight"
    },
    achievement: {
      title: "Achievements",
      empty: "No achievements yet.",
      first: {
        title: "First check-in",
        detail: "You completed your first workout."
      },
      streak3: {
        title: "3-day streak",
        detail: "You trained 3 days in a row."
      },
      streak7: {
        title: "7-day streak",
        detail: "A full week with consistency."
      },
      workout10: {
        title: "10 workouts",
        detail: "You reached 10 completed workouts."
      }
    },
    settings: {
      title: "Settings",
      themeLabel: "Theme",
      theme: {
        light: "Light",
        dark: "Dark",
        system: "System"
      },
      language: "Language",
      login: "Account login",
      logout: "Log out",
      email: "Email",
      password: "Password",
      signin: "Sign in",
      createAccount: "Create account",
      current: "Current",
      cloudSync: "Cloud sync",
      backupNow: "Backup now",
      restoreNow: "Restore backup",
      cloudHint: "Use Supabase to keep and recover your data on another device.",
      authSuccess: "Signed in successfully.",
      authError: "Authentication failed.",
      signupSuccess: "Account created. Check your email for confirmation.",
      backupSuccess: "Backup completed successfully.",
      backupError: "Cloud sync failed.",
      restoreSuccess: "Backup restored successfully.",
      errors: "Error logs",
      noErrors: "No errors logged."
    },
    signup: {
      title: "Create account",
      fullName: "Full name",
      age: "Age",
      heightCm: "Height (cm)",
      weightKg: "Weight (kg)",
      email: "Email",
      phone: "Phone",
      password: "Password",
      createAccount: "Finish sign up",
      successTitle: "Account created",
      successDesc: "Account created. Check your email for confirmation, then sign in.",
      error: "Sign up error",
      fillAll: "Please fill all fields.",
      genericError: "Could not create account."
    },
    auth: {
      loggedInAs: "Logged in as",
      loginLocal: "Login locally"
    },
    notification: {
      reminder: {
        title: "Workout reminder",
        body: "Today's workout is still pending."
      },
      motivation: {
        title: "Keep going",
        body1: "Discipline beats motivation.",
        body2: "One more session and you improve.",
        body3: "Consistency drives results."
      }
    }
  }
} as const;
