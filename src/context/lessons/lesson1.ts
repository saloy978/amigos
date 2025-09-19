import { LessonContent } from '../../types';

export const lesson1Content: LessonContent = {
  id: 'lesson-1-nouns-gender-number',
  title: 'Имя существительное — род и число',
  theory: `Имя существительное

В испанском языке существительные имеют категорию рода. 
Все существительные делятся на мужской род (masculino) и женский род (femenino).
Большинство существительных, оканчивающихся на гласную -о, относятся к мужскому роду,
в то время как большинство существительных, оканчивающихся на гласную -а, к женскому роду:

      Основные правила:
   -o → masculino (chico, libro, perro)
  chico мальчик
  amigo друг
  hermano брат
  libro книга
  alumno ученик
  museo музей

   -a → femenino (casa, amiga, playa)
  chica девочка
  amiga подруга
  hermana сестра
  casa дом
  alumna ученица
  playa пляж
   
      Исключения:
        masculino (несмотря на -a)
    papá папа
    día день
    policía полицейский

      femenino (несмотря на -o)
    mano рука
    radio радио

    К мужскому роду относятся существительные греческого происхождения,
оканчивающиеся на -ma и -ta:
    problema
    programa
    tema
    planeta
Существительные, оканчивающиеся на гласную -е, могут быть как
мужского, так и женского рода:

  masculino
    padre отец
    café кофе
    coche автомобиль
    hombre человек / мужчина

  femenino
    madre мать
    calle улица
    noche ночь
    tarde вечер / день

Существительные, оканчивающиеся на согласную, могут быть как
мужского, так и женского рода:
 
  masculino 
    amor любовь
    sol солнце
    avión самолет
    lápiz карандаш
    país страна
    césped газон

  femenino
   flor цветок
   sal соль
   operación операция
   luz свет
   crisis кризис
   pared стена    

    К женскому роду относятся существительные, оканчивающиеся на -ción,
  -tión, -sión, -ad:
   estación станция
   ciudad город
   cuestión вопрос
   verdad правда
   pensión пенсия
   felicidad счастье

   Существительные, оканчивающиеся на -ante, -iente, -ista обозначают лиц
как мужского, так и женского пола:
estudiante m студент, estudiante f студентка
cliente m клиент, cliente f клиентка
economista m, f экономист (мужчина и женщина)
`,
  
  dialogues: [
    {
      es: [
        "¿Es masculino o femenino?",
        "La casa es femenino.",
        "El libro es masculino.",
        "¿Y el problema?",
        "El problema es masculino también."
      ],
      ru: [
        "Это мужского или женского рода?",
        "Дом - женского рода.",
        "Книга - мужского рода.",
        "А проблема?",
        "Проблема тоже мужского рода."
      ]
    }
  ],
  
  practice: [
    {
      task: "Определите род существительных",
      items: [
        { ru: "chico", es: "masculino" },
        { ru: "amiga", es: "femenino" },
        { ru: "problema", es: "masculino" },
        { ru: "mano", es: "femenino" },
        { ru: "radio", es: "femenino" },
        { ru: "playa", es: "femenino" },
        { ru: "papá", es: "masculino" },
        { ru: "día", es: "masculino" }
      ]
    }
  ],
  
  games: [
    "Игра 1: Определение рода",
    "Игра 2: Множественное число", 
    "Игра 3: Классификация",
    "Игра 4: Поиск ошибок"
  ],
  
  tips: `💡 **Советы для запоминания:**

• Запоминайте исключения группами (día, papá - мужские с -a)
• Греческие слова на -ma обычно мужские
• Слова на -ción всегда женские
• При сомнениях в множественном числе: гласная +s, согласная +es`
};

// Данные для игр
export const lesson1Games = {
  gender: {
    items: [
      { term: "chico", answer: "m", explanation: "Окончание -o → masculino" },
      { term: "amiga", answer: "f", explanation: "Окончание -a → femenino" },
      { term: "problema", answer: "m", explanation: "Греческое -ma → masculino" },
      { term: "mano", answer: "f", explanation: "Исключение: mano → femenino" },
      { term: "radio", answer: "f", explanation: "Исключение: radio → femenino" },
      { term: "playa", answer: "f", explanation: "Окончание -a → femenino" },
      { term: "papá", answer: "m", explanation: "Исключение: papá → masculino" },
      { term: "día", answer: "m", explanation: "Исключение: día → masculino" }
    ]
  },
  
  plural: {
    items: [
      { singular: "libro", plural: "libros", rule: "Гласная +s" },
      { singular: "casa", plural: "casas", rule: "Гласная +s" },
      { singular: "ciudad", plural: "ciudades", rule: "Согласная +es" },
      { singular: "flor", plural: "flores", rule: "Согласная +es" },
      { singular: "lápiz", plural: "lápices", rule: "z → c + es" },
      { singular: "luz", plural: "luces", rule: "z → c + es" },
      { singular: "lunes", plural: "lunes", rule: "Не изменяется" },
      { singular: "crisis", plural: "crisis", rule: "Не изменяется" }
    ]
  },
  
  sort: {
    items: [
      { term: "chico", gender: "m" },
      { term: "hermana", gender: "f" },
      { term: "radio", gender: "f" },
      { term: "café", gender: "m" },
      { term: "estudiante", gender: "x" },
      { term: "economista", gender: "x" },
      { term: "planeta", gender: "m" },
      { term: "ciudad", gender: "f" }
    ]
  },
  
  findError: {
    items: [
      {
        wrong: "La mano es masculino.",
        right: "La mano es femenino.",
        explanation: "'mano' — исключение женского рода"
      },
      {
        wrong: "Los lápizes están en la mesa.",
        right: "Los lápices están en la mesa.",
        explanation: "z → c + es"
      },
      {
        wrong: "El problema es femenino.",
        right: "El problema es masculino.",
        explanation: "Греческое -ma → masculino"
      }
    ]
  }
};





















