// Вводный урок: Формы приветствия и обращения
export const introLesson = {
    id: "intro",
    title: "Формы приветствия и обращения",
  
    theory: `
  В испанском языке приветствия и прощания — важная часть общения. 
  Испанцы здороваются даже с незнакомыми людьми и обычно сопровождают это вопросом «¿Qué tal?» — «Как дела?».
  
  👋 Основные приветствия:
  - ¡Hola! — Привет / Здравствуйте
  - ¡Buenos días! — Доброе утро
  - ¡Buenas tardes! — Добрый день
  - ¡Buenas noches! — Добрый вечер / Спокойной ночи
  
  👋 Прощания:
  - ¡Hasta luego! — Пока
  - ¡Hasta pronto! — До скорого
  - ¡Hasta la vista! — До свидания
  - ¡Hasta mañana! — До завтра
  - ¡Adiós! — Прощай(те)
  
  🙋 Полезные выражения:
  - ¿Qué tal? — Как дела?
  - ¿Qué tal la vida? — Как жизнь?
  - ¿Qué tal la familia? — Как семья?
  - Bien, gracias. — Спасибо, хорошо
  - Todo va bien. — Всё хорошо
  - Más o menos bien. — Более или менее хорошо
  - Así así / Regular. — Так себе
  - Por favor. — Пожалуйста
  - Muchas gracias. — Большое спасибо
  - De nada. — Не за что
  `,
  
    dialogues: [
      {
        es: [
          "— Buenos días, señorita.",
          "— ¡Hola! ¿Qué tal?",
          "— Bien, gracias. ¿Y tú?",
          "— Regular. Hasta luego.",
          "— Hasta mañana."
        ],
        ru: [
          "— Доброе утро, сеньорита.",
          "— Привет, как дела?",
          "— Спасибо, хорошо. А как ты?",
          "— Так себе. Пока.",
          "— До завтра."
        ]
      },
      {
        es: [
          "— Buenas tardes, doña Rosa.",
          "— Hola, señor Pérez. ¿Qué tal la vida? ¿Qué tal la familia?",
          "— Más o menos bien, gracias.",
          "— Hasta la vista.",
          "— Adiós, doña Rosa."
        ],
        ru: [
          "— Добрый день, донья Роза.",
          "— Привет, сеньор Перес. Как жизнь? Как семья?",
          "— Более или менее, спасибо.",
          "— До свидания.",
          "— Прощайте, донья Роза."
        ]
      }
    ],
  
    practice: [
      {
        task: "Переведите на испанский:",
        items: [
          { ru: "привет", es: "hola" },
          { ru: "спасибо", es: "gracias" },
          { ru: "как дела?", es: "¿qué tal?" },
          { ru: "как жизнь?", es: "¿qué tal la vida?" },
          { ru: "до свидания", es: "hasta la vista" },
          { ru: "добрый день", es: "buenas tardes" },
          { ru: "прощайте", es: "adiós" },
          { ru: "как семья?", es: "¿qué tal la familia?" }
        ]
      }
    ],
  
    games: ["quiz", "matching"],
  
    tips: `
  💡 Совет:
  - На вопрос «¿Qué tal?» отвечайте коротко: «Bien, gracias» или «Todo va bien».
  - В официальной обстановке используйте обращения señor, señora, señorita.
  - Перед именем можно сказать don (для мужчин) или doña (для женщин).
  `
  };
  