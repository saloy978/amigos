interface WordSuggestion {
  term: string;
  translation: string;
  imageUrl?: string;
  example?: string;
  difficulty: string;
}

interface GenerationRequest {
  knownLanguage: string;
  learningLanguage: string;
  knownLanguageCode: string;
  learningLanguageCode: string;
  userLevel: string;
  existingWords: string[];
}

export class AIWordGeneratorService {
  // Значительно расширенная база слов с разнообразными темами
  private static WORD_TEMPLATES = {
    'A1': {
      'ru-en': [
        // Семья и люди
        { term: 'mother', translation: 'мама', example: 'My mother is very kind.' },
        { term: 'father', translation: 'папа', example: 'My father works in an office.' },
        { term: 'sister', translation: 'сестра', example: 'My sister is younger than me.' },
        { term: 'brother', translation: 'брат', example: 'My brother plays football.' },
        { term: 'grandmother', translation: 'бабушка', example: 'Grandmother makes delicious cookies.' },
        { term: 'grandfather', translation: 'дедушка', example: 'Grandfather tells interesting stories.' },
        { term: 'baby', translation: 'малыш', example: 'The baby is sleeping.' },
        { term: 'child', translation: 'ребёнок', example: 'The child is playing in the park.' },
        { term: 'man', translation: 'мужчина', example: 'The man is reading a newspaper.' },
        { term: 'woman', translation: 'женщина', example: 'The woman is cooking dinner.' },
        
        // Еда и напитки
        { term: 'apple', translation: 'яблоко', example: 'I eat an apple every day.' },
        { term: 'banana', translation: 'банан', example: 'Bananas are yellow and sweet.' },
        { term: 'orange', translation: 'апельсин', example: 'I drink orange juice for breakfast.' },
        { term: 'bread', translation: 'хлеб', example: 'We buy fresh bread every morning.' },
        { term: 'milk', translation: 'молоко', example: 'Children drink milk to grow strong.' },
        { term: 'coffee', translation: 'кофе', example: 'I drink coffee in the morning.' },
        { term: 'tea', translation: 'чай', example: 'Would you like some tea?' },
        { term: 'water', translation: 'вода', example: 'Water is essential for life.' },
        { term: 'juice', translation: 'сок', example: 'Apple juice is my favorite.' },
        { term: 'cake', translation: 'торт', example: 'We eat cake on birthdays.' },
        { term: 'pizza', translation: 'пицца', example: 'Pizza is popular around the world.' },
        { term: 'chicken', translation: 'курица', example: 'Grilled chicken is healthy.' },
        { term: 'fish', translation: 'рыба', example: 'Fish is good for your brain.' },
        { term: 'rice', translation: 'рис', example: 'Rice is a staple food in Asia.' },
        { term: 'pasta', translation: 'паста', example: 'Italian pasta is delicious.' },
        
        // Животные
        { term: 'dog', translation: 'собака', example: 'Dogs are loyal companions.' },
        { term: 'cat', translation: 'кот', example: 'Cats are independent animals.' },
        { term: 'bird', translation: 'птица', example: 'Birds can fly in the sky.' },
        { term: 'fish', translation: 'рыба', example: 'Fish live in water.' },
        { term: 'horse', translation: 'лошадь', example: 'Horses are strong animals.' },
        { term: 'cow', translation: 'корова', example: 'Cows give us milk.' },
        { term: 'pig', translation: 'свинья', example: 'Pigs are intelligent animals.' },
        { term: 'sheep', translation: 'овца', example: 'Sheep provide wool for clothing.' },
        { term: 'rabbit', translation: 'кролик', example: 'Rabbits hop quickly.' },
        { term: 'mouse', translation: 'мышь', example: 'The mouse is very small.' },
        
        // Дом и мебель
        { term: 'house', translation: 'дом', example: 'Our house has a beautiful garden.' },
        { term: 'room', translation: 'комната', example: 'My room is on the second floor.' },
        { term: 'kitchen', translation: 'кухня', example: 'We cook meals in the kitchen.' },
        { term: 'bedroom', translation: 'спальня', example: 'I sleep in my bedroom.' },
        { term: 'bathroom', translation: 'ванная', example: 'The bathroom has a big mirror.' },
        { term: 'table', translation: 'стол', example: 'We eat dinner at the table.' },
        { term: 'chair', translation: 'стул', example: 'Please sit on this chair.' },
        { term: 'bed', translation: 'кровать', example: 'I sleep in a comfortable bed.' },
        { term: 'sofa', translation: 'диван', example: 'We watch TV on the sofa.' },
        { term: 'window', translation: 'окно', example: 'The window overlooks the garden.' },
        { term: 'door', translation: 'дверь', example: 'Please close the door.' },
        { term: 'wall', translation: 'стена', example: 'The wall is painted blue.' },
        { term: 'floor', translation: 'пол', example: 'The floor is made of wood.' },
        { term: 'ceiling', translation: 'потолок', example: 'The ceiling is very high.' },
        { term: 'lamp', translation: 'лампа', example: 'Turn on the lamp, please.' },
        
        // Одежда
        { term: 'shirt', translation: 'рубашка', example: 'He wears a white shirt to work.' },
        { term: 'pants', translation: 'брюки', example: 'These pants are too long.' },
        { term: 'dress', translation: 'платье', example: 'She looks beautiful in that dress.' },
        { term: 'shoes', translation: 'туфли', example: 'I need new running shoes.' },
        { term: 'hat', translation: 'шляпа', example: 'Wear a hat to protect from sun.' },
        { term: 'coat', translation: 'пальто', example: 'It\'s cold, wear your coat.' },
        { term: 'jacket', translation: 'куртка', example: 'This jacket is very warm.' },
        { term: 'socks', translation: 'носки', example: 'I need to buy new socks.' },
        { term: 'gloves', translation: 'перчатки', example: 'Wear gloves in winter.' },
        { term: 'scarf', translation: 'шарф', example: 'The scarf keeps my neck warm.' },
        
        // Транспорт
        { term: 'car', translation: 'машина', example: 'My car is red and fast.' },
        { term: 'bus', translation: 'автобус', example: 'I take the bus to work.' },
        { term: 'train', translation: 'поезд', example: 'The train arrives at 3 PM.' },
        { term: 'plane', translation: 'самолёт', example: 'We fly by plane to other countries.' },
        { term: 'bike', translation: 'велосипед', example: 'Riding a bike is good exercise.' },
        { term: 'boat', translation: 'лодка', example: 'We sail the boat on the lake.' },
        { term: 'taxi', translation: 'такси', example: 'Call a taxi to the airport.' },
        { term: 'truck', translation: 'грузовик', example: 'The truck carries heavy goods.' },
        
        // Цвета
        { term: 'red', translation: 'красный', example: 'Roses are red and beautiful.' },
        { term: 'blue', translation: 'синий', example: 'The sky is blue today.' },
        { term: 'green', translation: 'зелёный', example: 'Grass is green in spring.' },
        { term: 'yellow', translation: 'жёлтый', example: 'The sun is bright yellow.' },
        { term: 'black', translation: 'чёрный', example: 'I wear a black suit to work.' },
        { term: 'white', translation: 'белый', example: 'Snow is white and cold.' },
        { term: 'brown', translation: 'коричневый', example: 'The tree trunk is brown.' },
        { term: 'pink', translation: 'розовый', example: 'She loves pink flowers.' },
        { term: 'purple', translation: 'фиолетовый', example: 'Purple is a royal color.' },
        { term: 'orange', translation: 'оранжевый', example: 'Orange leaves fall in autumn.' },
        
        // Числа
        { term: 'one', translation: 'один', example: 'I have one brother.' },
        { term: 'two', translation: 'два', example: 'Two plus two equals four.' },
        { term: 'three', translation: 'три', example: 'I have three cats.' },
        { term: 'four', translation: 'четыре', example: 'There are four seasons.' },
        { term: 'five', translation: 'пять', example: 'I wake up at five o\'clock.' },
        { term: 'six', translation: 'шесть', example: 'Six months make half a year.' },
        { term: 'seven', translation: 'семь', example: 'There are seven days in a week.' },
        { term: 'eight', translation: 'восемь', example: 'I sleep eight hours every night.' },
        { term: 'nine', translation: 'девять', example: 'Nine plus one equals ten.' },
        { term: 'ten', translation: 'десять', example: 'I have ten fingers.' },
        
        // Время и дни недели
        { term: 'morning', translation: 'утро', example: 'I exercise every morning.' },
        { term: 'afternoon', translation: 'день', example: 'We have lunch in the afternoon.' },
        { term: 'evening', translation: 'вечер', example: 'I read books in the evening.' },
        { term: 'night', translation: 'ночь', example: 'Stars shine at night.' },
        { term: 'today', translation: 'сегодня', example: 'Today is a beautiful day.' },
        { term: 'tomorrow', translation: 'завтра', example: 'Tomorrow I will visit my friend.' },
        { term: 'yesterday', translation: 'вчера', example: 'Yesterday was very busy.' },
        { term: 'Monday', translation: 'понедельник', example: 'Monday is the first day of work.' },
        { term: 'Tuesday', translation: 'вторник', example: 'I have a meeting on Tuesday.' },
        { term: 'Wednesday', translation: 'среда', example: 'Wednesday is in the middle of the week.' },
        { term: 'Thursday', translation: 'четверг', example: 'Thursday comes before Friday.' },
        { term: 'Friday', translation: 'пятница', example: 'Friday is the last working day.' },
        { term: 'Saturday', translation: 'суббота', example: 'Saturday is perfect for relaxing.' },
        { term: 'Sunday', translation: 'воскресенье', example: 'Sunday is a day for family.' },
        
        // Природа и погода
        { term: 'sun', translation: 'солнце', example: 'The sun gives us light and warmth.' },
        { term: 'moon', translation: 'луна', example: 'The moon is bright tonight.' },
        { term: 'star', translation: 'звезда', example: 'Stars twinkle in the dark sky.' },
        { term: 'cloud', translation: 'облако', example: 'White clouds float in the sky.' },
        { term: 'rain', translation: 'дождь', example: 'Plants need rain to grow.' },
        { term: 'snow', translation: 'снег', example: 'Snow covers the ground in winter.' },
        { term: 'wind', translation: 'ветер', example: 'The wind blows the leaves.' },
        { term: 'tree', translation: 'дерево', example: 'The old tree provides shade.' },
        { term: 'flower', translation: 'цветок', example: 'This flower smells wonderful.' },
        { term: 'grass', translation: 'трава', example: 'Green grass grows in the garden.' },
        { term: 'mountain', translation: 'гора', example: 'The mountain is very tall.' },
        { term: 'river', translation: 'река', example: 'Fish swim in the clear river.' },
        { term: 'sea', translation: 'море', example: 'We swim in the warm sea.' },
        { term: 'beach', translation: 'пляж', example: 'The beach has white sand.' },
        { term: 'forest', translation: 'лес', example: 'Many animals live in the forest.' },
        
        // Школа и образование
        { term: 'school', translation: 'школа', example: 'Children learn many things at school.' },
        { term: 'teacher', translation: 'учитель', example: 'Our teacher is very patient.' },
        { term: 'student', translation: 'ученик', example: 'Every student has different talents.' },
        { term: 'book', translation: 'книга', example: 'This book tells an exciting story.' },
        { term: 'pen', translation: 'ручка', example: 'I write with a blue pen.' },
        { term: 'pencil', translation: 'карандаш', example: 'Draw the picture with a pencil.' },
        { term: 'paper', translation: 'бумага', example: 'Write your name on this paper.' },
        { term: 'desk', translation: 'парта', example: 'Each student has their own desk.' },
        { term: 'blackboard', translation: 'доска', example: 'The teacher writes on the blackboard.' },
        { term: 'lesson', translation: 'урок', example: 'Today\'s lesson is about animals.' },
        
        // Работа и профессии
        { term: 'work', translation: 'работа', example: 'I enjoy my work very much.' },
        { term: 'job', translation: 'работа', example: 'Finding a good job is important.' },
        { term: 'doctor', translation: 'врач', example: 'The doctor helps sick people.' },
        { term: 'nurse', translation: 'медсестра', example: 'The nurse takes care of patients.' },
        { term: 'teacher', translation: 'учитель', example: 'A teacher educates children.' },
        { term: 'police', translation: 'полиция', example: 'Police officers keep us safe.' },
        { term: 'cook', translation: 'повар', example: 'The cook makes delicious meals.' },
        { term: 'driver', translation: 'водитель', example: 'The bus driver is very careful.' },
        { term: 'farmer', translation: 'фермер', example: 'Farmers grow food for everyone.' },
        { term: 'artist', translation: 'художник', example: 'The artist paints beautiful pictures.' },
        
        // Спорт и хобби
        { term: 'sport', translation: 'спорт', example: 'Sport keeps us healthy and strong.' },
        { term: 'football', translation: 'футбол', example: 'Football is popular worldwide.' },
        { term: 'basketball', translation: 'баскетбол', example: 'Basketball players are very tall.' },
        { term: 'tennis', translation: 'теннис', example: 'Tennis requires good coordination.' },
        { term: 'swimming', translation: 'плавание', example: 'Swimming is excellent exercise.' },
        { term: 'running', translation: 'бег', example: 'Running helps build endurance.' },
        { term: 'dancing', translation: 'танцы', example: 'Dancing is fun and artistic.' },
        { term: 'singing', translation: 'пение', example: 'Singing makes people happy.' },
        { term: 'reading', translation: 'чтение', example: 'Reading expands your knowledge.' },
        { term: 'writing', translation: 'письмо', example: 'Writing helps express thoughts.' },
        
        // Технологии
        { term: 'computer', translation: 'компьютер', example: 'I use a computer for work.' },
        { term: 'phone', translation: 'телефон', example: 'My phone helps me stay connected.' },
        { term: 'internet', translation: 'интернет', example: 'The internet connects the world.' },
        { term: 'email', translation: 'электронная почта', example: 'I check my email every morning.' },
        { term: 'website', translation: 'веб-сайт', example: 'This website has useful information.' },
        { term: 'camera', translation: 'камера', example: 'I take photos with my camera.' },
        { term: 'television', translation: 'телевизор', example: 'We watch news on television.' },
        { term: 'radio', translation: 'радио', example: 'I listen to music on the radio.' },
        
        // Покупки и деньги
        { term: 'money', translation: 'деньги', example: 'Money is needed to buy things.' },
        { term: 'shop', translation: 'магазин', example: 'I buy groceries at the shop.' },
        { term: 'market', translation: 'рынок', example: 'Fresh fruits are sold at the market.' },
        { term: 'price', translation: 'цена', example: 'The price of this book is reasonable.' },
        { term: 'buy', translation: 'покупать', example: 'I want to buy a new car.' },
        { term: 'sell', translation: 'продавать', example: 'They sell fresh vegetables.' },
        { term: 'pay', translation: 'платить', example: 'I pay with my credit card.' },
        { term: 'cheap', translation: 'дешёвый', example: 'This restaurant is cheap but good.' },
        { term: 'expensive', translation: 'дорогой', example: 'Diamond rings are very expensive.' },
        { term: 'free', translation: 'бесплатный', example: 'The museum entrance is free today.' }
      ],
      'ru-es': [
        // Семья и люди
        { term: 'madre', translation: 'мама', example: 'Mi madre es muy cariñosa.' },
        { term: 'padre', translation: 'папа', example: 'Mi padre trabaja en una oficina.' },
        { term: 'hermana', translation: 'сестра', example: 'Mi hermana es menor que yo.' },
        { term: 'hermano', translation: 'брат', example: 'Mi hermano juega al fútbol.' },
        { term: 'abuela', translation: 'бабушка', example: 'La abuela hace galletas deliciosas.' },
        { term: 'abuelo', translation: 'дедушка', example: 'El abuelo cuenta historias interesantes.' },
        { term: 'bebé', translation: 'малыш', example: 'El bebé está durmiendo.' },
        { term: 'niño', translation: 'ребёнок', example: 'El niño juega en el parque.' },
        { term: 'hombre', translation: 'мужчина', example: 'El hombre lee el periódico.' },
        { term: 'mujer', translation: 'женщина', example: 'La mujer cocina la cena.' },
        
        // Еда и напитки
        { term: 'manzana', translation: 'яблоко', example: 'Como una manzana cada día.' },
        { term: 'plátano', translation: 'банан', example: 'Los plátanos son amarillos y dulces.' },
        { term: 'naranja', translation: 'апельсин', example: 'Bebo jugo de naranja en el desayuno.' },
        { term: 'pan', translation: 'хлеб', example: 'Compramos pan fresco cada mañana.' },
        { term: 'leche', translation: 'молоко', example: 'Los niños beben leche para crecer fuertes.' },
        { term: 'café', translation: 'кофе', example: 'Bebo café por la mañana.' },
        { term: 'té', translation: 'чай', example: '¿Te gustaría un poco de té?' },
        { term: 'agua', translation: 'вода', example: 'El agua es esencial para la vida.' },
        { term: 'jugo', translation: 'сок', example: 'El jugo de manzana es mi favorito.' },
        { term: 'pastel', translation: 'торт', example: 'Comemos pastel en los cumpleaños.' },
        { term: 'pizza', translation: 'пицца', example: 'La pizza es popular en todo el mundo.' },
        { term: 'pollo', translation: 'курица', example: 'El pollo a la parrilla es saludable.' },
        { term: 'pescado', translation: 'рыба', example: 'El pescado es bueno para el cerebro.' },
        { term: 'arroz', translation: 'рис', example: 'El arroz es un alimento básico en Asia.' },
        { term: 'pasta', translation: 'паста', example: 'La pasta italiana es deliciosa.' },
        
        // Животные
        { term: 'perro', translation: 'собака', example: 'Los perros son compañeros leales.' },
        { term: 'gato', translation: 'кот', example: 'Los gatos son animales independientes.' },
        { term: 'pájaro', translation: 'птица', example: 'Los pájaros pueden volar en el cielo.' },
        { term: 'pez', translation: 'рыба', example: 'Los peces viven en el agua.' },
        { term: 'caballo', translation: 'лошадь', example: 'Los caballos son animales fuertes.' },
        { term: 'vaca', translation: 'корова', example: 'Las vacas nos dan leche.' },
        { term: 'cerdo', translation: 'свинья', example: 'Los cerdos son animales inteligentes.' },
        { term: 'oveja', translation: 'овца', example: 'Las ovejas proporcionan lana para la ropa.' },
        { term: 'conejo', translation: 'кролик', example: 'Los conejos saltan rápidamente.' },
        { term: 'ratón', translation: 'мышь', example: 'El ratón es muy pequeño.' },
        
        // Дом и мебель
        { term: 'casa', translation: 'дом', example: 'Nuestra casa tiene un jardín hermoso.' },
        { term: 'habitación', translation: 'комната', example: 'Mi habitación está en el segundo piso.' },
        { term: 'cocina', translation: 'кухня', example: 'Cocinamos las comidas en la cocina.' },
        { term: 'dormitorio', translation: 'спальня', example: 'Duermo en mi dormitorio.' },
        { term: 'baño', translation: 'ванная', example: 'El baño tiene un espejo grande.' },
        { term: 'mesa', translation: 'стол', example: 'Cenamos en la mesa.' },
        { term: 'silla', translation: 'стул', example: 'Por favor, siéntate en esta silla.' },
        { term: 'cama', translation: 'кровать', example: 'Duermo en una cama cómoda.' },
        { term: 'sofá', translation: 'диван', example: 'Vemos televisión en el sofá.' },
        { term: 'ventana', translation: 'окно', example: 'La ventana da al jardín.' },
        { term: 'puerta', translation: 'дверь', example: 'Por favor, cierra la puerta.' },
        { term: 'pared', translation: 'стена', example: 'La pared está pintada de azul.' },
        { term: 'suelo', translation: 'пол', example: 'El suelo es de madera.' },
        { term: 'techo', translation: 'потолок', example: 'El techo es muy alto.' },
        { term: 'lámpara', translation: 'лампа', example: 'Enciende la lámpara, por favor.' },
        
        // Одежда
        { term: 'camisa', translation: 'рубашка', example: 'Lleva una camisa blanca al trabajo.' },
        { term: 'pantalones', translation: 'брюки', example: 'Estos pantalones son muy largos.' },
        { term: 'vestido', translation: 'платье', example: 'Se ve hermosa con ese vestido.' },
        { term: 'zapatos', translation: 'туфли', example: 'Necesito zapatos nuevos para correr.' },
        { term: 'sombrero', translation: 'шляпа', example: 'Usa un sombrero para protegerte del sol.' },
        { term: 'abrigo', translation: 'пальто', example: 'Hace frío, ponte el abrigo.' },
        { term: 'chaqueta', translation: 'куртка', example: 'Esta chaqueta es muy abrigada.' },
        { term: 'calcetines', translation: 'носки', example: 'Necesito comprar calcetines nuevos.' },
        { term: 'guantes', translation: 'перчатки', example: 'Usa guantes en invierno.' },
        { term: 'bufanda', translation: 'шарф', example: 'La bufanda mantiene caliente mi cuello.' },
        
        // Транспорт
        { term: 'coche', translation: 'машина', example: 'Mi coche es rojo y rápido.' },
        { term: 'autobús', translation: 'автобус', example: 'Tomo el autobús para ir al trabajo.' },
        { term: 'tren', translation: 'поезд', example: 'El tren llega a las 3 PM.' },
        { term: 'avión', translation: 'самолёт', example: 'Volamos en avión a otros países.' },
        { term: 'bicicleta', translation: 'велосипед', example: 'Montar en bicicleta es buen ejercicio.' },
        { term: 'barco', translation: 'лодка', example: 'Navegamos el barco en el lago.' },
        { term: 'taxi', translation: 'такси', example: 'Llama un taxi al aeropuerto.' },
        { term: 'camión', translation: 'грузовик', example: 'El camión transporta mercancías pesadas.' },
        
        // Цвета
        { term: 'rojo', translation: 'красный', example: 'Las rosas son rojas y hermosas.' },
        { term: 'azul', translation: 'синий', example: 'El cielo está azul hoy.' },
        { term: 'verde', translation: 'зелёный', example: 'La hierba es verde en primavera.' },
        { term: 'amarillo', translation: 'жёлтый', example: 'El sol es amarillo brillante.' },
        { term: 'negro', translation: 'чёрный', example: 'Llevo un traje negro al trabajo.' },
        { term: 'blanco', translation: 'белый', example: 'La nieve es blanca y fría.' },
        { term: 'marrón', translation: 'коричневый', example: 'El tronco del árbol es marrón.' },
        { term: 'rosa', translation: 'розовый', example: 'Le encantan las flores rosas.' },
        { term: 'morado', translation: 'фиолетовый', example: 'El morado es un color real.' },
        { term: 'naranja', translation: 'оранжевый', example: 'Las hojas naranjas caen en otoño.' },
        
        // Числа
        { term: 'uno', translation: 'один', example: 'Tengo un hermano.' },
        { term: 'dos', translation: 'два', example: 'Dos más dos son cuatro.' },
        { term: 'tres', translation: 'три', example: 'Tengo tres gatos.' },
        { term: 'cuatro', translation: 'четыре', example: 'Hay cuatro estaciones.' },
        { term: 'cinco', translation: 'пять', example: 'Me despierto a las cinco.' },
        { term: 'seis', translation: 'шесть', example: 'Seis meses hacen medio año.' },
        { term: 'siete', translation: 'семь', example: 'Hay siete días en una semana.' },
        { term: 'ocho', translation: 'восемь', example: 'Duermo ocho horas cada noche.' },
        { term: 'nueve', translation: 'девять', example: 'Nueve más uno son diez.' },
        { term: 'diez', translation: 'десять', example: 'Tengo diez dedos.' },
        
        // Время и дни недели
        { term: 'mañana', translation: 'утро', example: 'Hago ejercicio cada mañana.' },
        { term: 'tarde', translation: 'день', example: 'Almorzamos por la tarde.' },
        { term: 'noche', translation: 'вечер', example: 'Leo libros por la noche.' },
        { term: 'noche', translation: 'ночь', example: 'Las estrellas brillan en la noche.' },
        { term: 'hoy', translation: 'сегодня', example: 'Hoy es un día hermoso.' },
        { term: 'mañana', translation: 'завтра', example: 'Mañana visitaré a mi amigo.' },
        { term: 'ayer', translation: 'вчера', example: 'Ayer estuvo muy ocupado.' },
        { term: 'lunes', translation: 'понедельник', example: 'El lunes es el primer día de trabajo.' },
        { term: 'martes', translation: 'вторник', example: 'Tengo una reunión el martes.' },
        { term: 'miércoles', translation: 'среда', example: 'El miércoles está en medio de la semana.' },
        { term: 'jueves', translation: 'четверг', example: 'El jueves viene antes del viernes.' },
        { term: 'viernes', translation: 'пятница', example: 'El viernes es el último día laboral.' },
        { term: 'sábado', translation: 'суббота', example: 'El sábado es perfecto para relajarse.' },
        { term: 'domingo', translation: 'воскресенье', example: 'El domingo es un día para la familia.' },
        
        // Природа и погода
        { term: 'sol', translation: 'солнце', example: 'El sol nos da luz y calor.' },
        { term: 'luna', translation: 'луна', example: 'La luna está brillante esta noche.' },
        { term: 'estrella', translation: 'звезда', example: 'Las estrellas titilan en el cielo oscuro.' },
        { term: 'nube', translation: 'облако', example: 'Las nubes blancas flotan en el cielo.' },
        { term: 'lluvia', translation: 'дождь', example: 'Las plantas necesitan lluvia para crecer.' },
        { term: 'nieve', translation: 'снег', example: 'La nieve cubre el suelo en invierno.' },
        { term: 'viento', translation: 'ветер', example: 'El viento sopla las hojas.' },
        { term: 'árbol', translation: 'дерево', example: 'El árbol viejo da sombra.' },
        { term: 'flor', translation: 'цветок', example: 'Esta flor huele maravilloso.' },
        { term: 'hierba', translation: 'трава', example: 'La hierba verde crece en el jardín.' },
        { term: 'montaña', translation: 'гора', example: 'La montaña es muy alta.' },
        { term: 'río', translation: 'река', example: 'Los peces nadan en el río claro.' },
        { term: 'mar', translation: 'море', example: 'Nadamos en el mar cálido.' },
        { term: 'playa', translation: 'пляж', example: 'La playa tiene arena blanca.' },
        { term: 'bosque', translation: 'лес', example: 'Muchos animales viven en el bosque.' },
        
        // Школа и образование
        { term: 'escuela', translation: 'школа', example: 'Los niños aprenden muchas cosas en la escuela.' },
        { term: 'maestro', translation: 'учитель', example: 'Nuestro maestro es muy paciente.' },
        { term: 'estudiante', translation: 'ученик', example: 'Cada estudiante tiene talentos diferentes.' },
        { term: 'libro', translation: 'книга', example: 'Este libro cuenta una historia emocionante.' },
        { term: 'bolígrafo', translation: 'ручка', example: 'Escribo con un bolígrafo azul.' },
        { term: 'lápiz', translation: 'карандаш', example: 'Dibuja la imagen con un lápiz.' },
        { term: 'papel', translation: 'бумага', example: 'Escribe tu nombre en este papel.' },
        { term: 'escritorio', translation: 'парта', example: 'Cada estudiante tiene su propio escritorio.' },
        { term: 'pizarra', translation: 'доска', example: 'El maestro escribe en la pizarra.' },
        { term: 'lección', translation: 'урок', example: 'La lección de hoy es sobre animales.' },
        
        // Работа и профессии
        { term: 'trabajo', translation: 'работа', example: 'Disfruto mucho mi trabajo.' },
        { term: 'empleo', translation: 'работа', example: 'Encontrar un buen empleo es importante.' },
        { term: 'médico', translation: 'врач', example: 'El médico ayuda a las personas enfermas.' },
        { term: 'enfermera', translation: 'медсестра', example: 'La enfermera cuida a los pacientes.' },
        { term: 'maestro', translation: 'учитель', example: 'Un maestro educa a los niños.' },
        { term: 'policía', translation: 'полиция', example: 'Los policías nos mantienen seguros.' },
        { term: 'cocinero', translation: 'повар', example: 'El cocinero hace comidas deliciosas.' },
        { term: 'conductor', translation: 'водитель', example: 'El conductor del autobús es muy cuidadoso.' },
        { term: 'granjero', translation: 'фермер', example: 'Los granjeros cultivan comida para todos.' },
        { term: 'artista', translation: 'художник', example: 'El artista pinta cuadros hermosos.' },
        
        // Спорт и хобби
        { term: 'deporte', translation: 'спорт', example: 'El deporte nos mantiene sanos y fuertes.' },
        { term: 'fútbol', translation: 'футбол', example: 'El fútbol es popular en todo el mundo.' },
        { term: 'baloncesto', translation: 'баскетбол', example: 'Los jugadores de baloncesto son muy altos.' },
        { term: 'tenis', translation: 'теннис', example: 'El tenis requiere buena coordinación.' },
        { term: 'natación', translation: 'плавание', example: 'La natación es un ejercicio excelente.' },
        { term: 'correr', translation: 'бег', example: 'Correr ayuda a desarrollar resistencia.' },
        { term: 'bailar', translation: 'танцы', example: 'Bailar es divertido y artístico.' },
        { term: 'cantar', translation: 'пение', example: 'Cantar hace feliz a la gente.' },
        { term: 'leer', translation: 'чтение', example: 'Leer amplía tu conocimiento.' },
        { term: 'escribir', translation: 'письмо', example: 'Escribir ayuda a expresar pensamientos.' },
        
        // Технологии
        { term: 'computadora', translation: 'компьютер', example: 'Uso una computadora para trabajar.' },
        { term: 'teléfono', translation: 'телефон', example: 'Mi teléfono me ayuda a mantenerme conectado.' },
        { term: 'internet', translation: 'интернет', example: 'Internet conecta el mundo.' },
        { term: 'correo', translation: 'электронная почта', example: 'Reviso mi correo cada mañana.' },
        { term: 'sitio web', translation: 'веб-сайт', example: 'Este sitio web tiene información útil.' },
        { term: 'cámara', translation: 'камера', example: 'Tomo fotos con mi cámara.' },
        { term: 'televisión', translation: 'телевизор', example: 'Vemos noticias en la televisión.' },
        { term: 'radio', translation: 'радио', example: 'Escucho música en la radio.' },
        
        // Покупки и деньги
        { term: 'dinero', translation: 'деньги', example: 'El dinero es necesario para comprar cosas.' },
        { term: 'tienda', translation: 'магазин', example: 'Compro comestibles en la tienda.' },
        { term: 'mercado', translation: 'рынок', example: 'Las frutas frescas se venden en el mercado.' },
        { term: 'precio', translation: 'цена', example: 'El precio de este libro es razonable.' },
        { term: 'comprar', translation: 'покупать', example: 'Quiero comprar un coche nuevo.' },
        { term: 'vender', translation: 'продавать', example: 'Venden verduras frescas.' },
        { term: 'pagar', translation: 'платить', example: 'Pago con mi tarjeta de crédito.' },
        { term: 'barato', translation: 'дешёвый', example: 'Este restaurante es barato pero bueno.' },
        { term: 'caro', translation: 'дорогой', example: 'Los anillos de diamante son muy caros.' },
        { term: 'gratis', translation: 'бесплатный', example: 'La entrada al museo es gratis hoy.' }
      ]
    },
    'A2': {
      'ru-en': [
        // Повседневная жизнь
        { term: 'to wake up', translation: 'просыпаться', example: 'I wake up at 7 AM every day.' },
        { term: 'to get dressed', translation: 'одеваться', example: 'I get dressed quickly in the morning.' },
        { term: 'to have breakfast', translation: 'завтракать', example: 'We have breakfast together as a family.' },
        { term: 'to brush teeth', translation: 'чистить зубы', example: 'Don\'t forget to brush your teeth.' },
        { term: 'to take a shower', translation: 'принимать душ', example: 'I take a shower every evening.' },
        { term: 'to go to bed', translation: 'ложиться спать', example: 'Children should go to bed early.' },
        { term: 'to do homework', translation: 'делать домашнее задание', example: 'Students do homework after school.' },
        { term: 'to watch TV', translation: 'смотреть телевизор', example: 'We watch TV in the evening.' },
        { term: 'to listen to music', translation: 'слушать музыку', example: 'I listen to music while working.' },
        { term: 'to play games', translation: 'играть в игры', example: 'Children love to play games.' },
        
        // Покупки и еда
        { term: 'to go shopping', translation: 'ходить за покупками', example: 'We go shopping on weekends.' },
        { term: 'to buy groceries', translation: 'покупать продукты', example: 'I buy groceries at the supermarket.' },
        { term: 'to cook dinner', translation: 'готовить ужин', example: 'Mom cooks dinner for the family.' },
        { term: 'to set the table', translation: 'накрывать на стол', example: 'Please help me set the table.' },
        { term: 'to wash dishes', translation: 'мыть посуду', example: 'I wash dishes after every meal.' },
        { term: 'to order food', translation: 'заказывать еду', example: 'We order food from our favorite restaurant.' },
        { term: 'to pay the bill', translation: 'оплачивать счёт', example: 'Dad always pays the bill at restaurants.' },
        { term: 'to try on clothes', translation: 'примерять одежду', example: 'I like to try on clothes before buying.' },
        { term: 'to return items', translation: 'возвращать товары', example: 'You can return items within 30 days.' },
        { term: 'to save money', translation: 'экономить деньги', example: 'It\'s important to save money for the future.' },
        
        // Путешествия и транспорт
        { term: 'to travel abroad', translation: 'путешествовать за границу', example: 'We travel abroad once a year.' },
        { term: 'to book a hotel', translation: 'бронировать отель', example: 'I need to book a hotel for our trip.' },
        { term: 'to pack luggage', translation: 'упаковывать багаж', example: 'Don\'t forget to pack your luggage.' },
        { term: 'to catch a flight', translation: 'успевать на рейс', example: 'We need to hurry to catch our flight.' },
        { term: 'to miss the bus', translation: 'опаздывать на автобус', example: 'I don\'t want to miss the bus again.' },
        { term: 'to ask for directions', translation: 'спрашивать дорогу', example: 'Tourists often ask for directions.' },
        { term: 'to get lost', translation: 'заблудиться', example: 'It\'s easy to get lost in a big city.' },
        { term: 'to take photos', translation: 'фотографировать', example: 'Tourists love to take photos of landmarks.' },
        { term: 'to visit museums', translation: 'посещать музеи', example: 'We visit museums to learn about history.' },
        { term: 'to explore the city', translation: 'исследовать город', example: 'I love to explore new cities on foot.' },
        
        // Работа и учёба
        { term: 'to attend classes', translation: 'посещать занятия', example: 'Students must attend all classes.' },
        { term: 'to take notes', translation: 'делать записи', example: 'I take notes during important meetings.' },
        { term: 'to give a presentation', translation: 'делать презентацию', example: 'Tomorrow I will give a presentation.' },
        { term: 'to work overtime', translation: 'работать сверхурочно', example: 'Sometimes I have to work overtime.' },
        { term: 'to meet deadlines', translation: 'соблюдать сроки', example: 'It\'s important to meet all deadlines.' },
        { term: 'to apply for a job', translation: 'подавать заявление на работу', example: 'I want to apply for this job.' },
        { term: 'to have an interview', translation: 'проходить собеседование', example: 'I have an interview next week.' },
        { term: 'to get promoted', translation: 'получать повышение', example: 'Hard work can help you get promoted.' },
        { term: 'to retire', translation: 'выходить на пенсию', example: 'My grandfather will retire next year.' },
        { term: 'to earn money', translation: 'зарабатывать деньги', example: 'Everyone needs to earn money to live.' },
        
        // Здоровье и спорт
        { term: 'to feel sick', translation: 'чувствовать себя больным', example: 'I feel sick today, so I\'ll stay home.' },
        { term: 'to see a doctor', translation: 'обращаться к врачу', example: 'You should see a doctor about that cough.' },
        { term: 'to take medicine', translation: 'принимать лекарство', example: 'Take this medicine three times a day.' },
        { term: 'to exercise regularly', translation: 'регулярно заниматься спортом', example: 'I try to exercise regularly to stay healthy.' },
        { term: 'to join a gym', translation: 'записаться в спортзал', example: 'I want to join a gym near my house.' },
        { term: 'to go jogging', translation: 'бегать трусцой', example: 'I go jogging every morning in the park.' },
        { term: 'to play tennis', translation: 'играть в теннис', example: 'Do you want to play tennis this weekend?' },
        { term: 'to swim laps', translation: 'плавать дорожки', example: 'I swim laps at the local pool.' },
        { term: 'to lift weights', translation: 'поднимать тяжести', example: 'He likes to lift weights at the gym.' },
        { term: 'to stretch muscles', translation: 'растягивать мышцы', example: 'Always stretch your muscles before exercising.' },
        
        // Общение и отношения
        { term: 'to make friends', translation: 'заводить друзей', example: 'It\'s easy to make friends when you\'re kind.' },
        { term: 'to keep in touch', translation: 'поддерживать связь', example: 'We keep in touch through social media.' },
        { term: 'to have an argument', translation: 'ссориться', example: 'Sometimes friends have arguments.' },
        { term: 'to apologize', translation: 'извиняться', example: 'I need to apologize for being late.' },
        { term: 'to forgive someone', translation: 'прощать кого-то', example: 'It\'s important to forgive people.' },
        { term: 'to fall in love', translation: 'влюбляться', example: 'They fell in love at first sight.' },
        { term: 'to get married', translation: 'жениться/выходить замуж', example: 'They plan to get married next summer.' },
        { term: 'to have children', translation: 'иметь детей', example: 'They want to have children someday.' },
        { term: 'to celebrate birthdays', translation: 'праздновать дни рождения', example: 'We always celebrate birthdays with cake.' },
        { term: 'to invite guests', translation: 'приглашать гостей', example: 'We invite guests for dinner on Sundays.' },
        
        // Хобби и развлечения
        { term: 'to collect stamps', translation: 'коллекционировать марки', example: 'My grandfather likes to collect stamps.' },
        { term: 'to play chess', translation: 'играть в шахматы', example: 'Chess helps develop strategic thinking.' },
        { term: 'to solve puzzles', translation: 'решать головоломки', example: 'I enjoy solving crossword puzzles.' },
        { term: 'to paint pictures', translation: 'рисовать картины', example: 'She loves to paint pictures of nature.' },
        { term: 'to play guitar', translation: 'играть на гитаре', example: 'I\'m learning to play guitar.' },
        { term: 'to sing songs', translation: 'петь песни', example: 'We sing songs around the campfire.' },
        { term: 'to dance salsa', translation: 'танцевать сальсу', example: 'They take classes to dance salsa.' },
        { term: 'to read novels', translation: 'читать романы', example: 'I love to read mystery novels.' },
        { term: 'to watch movies', translation: 'смотреть фильмы', example: 'We watch movies every Friday night.' },
        { term: 'to go to concerts', translation: 'ходить на концерты', example: 'I go to concerts whenever possible.' },
        
        // Технологии и интернет
        { term: 'to send emails', translation: 'отправлять электронные письма', example: 'I send emails to my colleagues daily.' },
        { term: 'to browse the internet', translation: 'просматривать интернет', example: 'I browse the internet for news.' },
        { term: 'to download files', translation: 'скачивать файлы', example: 'You can download files from this website.' },
        { term: 'to upload photos', translation: 'загружать фотографии', example: 'I upload photos to social media.' },
        { term: 'to video chat', translation: 'общаться по видеосвязи', example: 'We video chat with family abroad.' },
        { term: 'to use apps', translation: 'использовать приложения', example: 'I use apps to learn languages.' },
        { term: 'to charge devices', translation: 'заряжать устройства', example: 'Don\'t forget to charge your phone.' },
        { term: 'to backup data', translation: 'создавать резервные копии данных', example: 'Always backup important data.' },
        { term: 'to update software', translation: 'обновлять программное обеспечение', example: 'Update your software regularly.' },
        { term: 'to protect privacy', translation: 'защищать конфиденциальность', example: 'It\'s important to protect your privacy online.' }
      ],
      'ru-es': [
        // Повседневная жизнь
        { term: 'despertarse', translation: 'просыпаться', example: 'Me despierto a las 7 AM todos los días.' },
        { term: 'vestirse', translation: 'одеваться', example: 'Me visto rápidamente por la mañana.' },
        { term: 'desayunar', translation: 'завтракать', example: 'Desayunamos juntos en familia.' },
        { term: 'cepillarse los dientes', translation: 'чистить зубы', example: 'No olvides cepillarte los dientes.' },
        { term: 'ducharse', translation: 'принимать душ', example: 'Me ducho cada noche.' },
        { term: 'acostarse', translation: 'ложиться спать', example: 'Los niños deben acostarse temprano.' },
        { term: 'hacer la tarea', translation: 'делать домашнее задание', example: 'Los estudiantes hacen la tarea después de la escuela.' },
        { term: 'ver televisión', translation: 'смотреть телевизор', example: 'Vemos televisión por la noche.' },
        { term: 'escuchar música', translation: 'слушать музыку', example: 'Escucho música mientras trabajo.' },
        { term: 'jugar juegos', translation: 'играть в игры', example: 'A los niños les encanta jugar juegos.' },
        
        // Покупки и еда
        { term: 'ir de compras', translation: 'ходить за покупками', example: 'Vamos de compras los fines de semana.' },
        { term: 'comprar comestibles', translation: 'покупать продукты', example: 'Compro comestibles en el supermercado.' },
        { term: 'cocinar la cena', translation: 'готовить ужин', example: 'Mamá cocina la cena para la familia.' },
        { term: 'poner la mesa', translation: 'накрывать на стол', example: 'Por favor, ayúdame a poner la mesa.' },
        { term: 'lavar los platos', translation: 'мыть посуду', example: 'Lavo los platos después de cada comida.' },
        { term: 'pedir comida', translation: 'заказывать еду', example: 'Pedimos comida de nuestro restaurante favorito.' },
        { term: 'pagar la cuenta', translation: 'оплачивать счёт', example: 'Papá siempre paga la cuenta en los restaurantes.' },
        { term: 'probarse ropa', translation: 'примерять одежду', example: 'Me gusta probarme la ropa antes de comprar.' },
        { term: 'devolver artículos', translation: 'возвращать товары', example: 'Puedes devolver artículos dentro de 30 días.' },
        { term: 'ahorrar dinero', translation: 'экономить деньги', example: 'Es importante ahorrar dinero para el futuro.' },
        
        // Путешествия и транспорт
        { term: 'viajar al extranjero', translation: 'путешествовать за границу', example: 'Viajamos al extranjero una vez al año.' },
        { term: 'reservar un hotel', translation: 'бронировать отель', example: 'Necesito reservar un hotel para nuestro viaje.' },
        { term: 'hacer las maletas', translation: 'упаковывать багаж', example: 'No olvides hacer las maletas.' },
        { term: 'tomar un vuelo', translation: 'успевать на рейс', example: 'Necesitamos apurarnos para tomar nuestro vuelo.' },
        { term: 'perder el autobús', translation: 'опаздывать на автобус', example: 'No quiero perder el autobús otra vez.' },
        { term: 'pedir direcciones', translation: 'спрашивать дорогу', example: 'Los turistas a menudo piden direcciones.' },
        { term: 'perderse', translation: 'заблудиться', example: 'Es fácil perderse en una ciudad grande.' },
        { term: 'tomar fotos', translation: 'фотографировать', example: 'A los turistas les encanta tomar fotos de monumentos.' },
        { term: 'visitar museos', translation: 'посещать музеи', example: 'Visitamos museos para aprender sobre historia.' },
        { term: 'explorar la ciudad', translation: 'исследовать город', example: 'Me encanta explorar nuevas ciudades a pie.' },
        
        // Работа и учёба
        { term: 'asistir a clases', translation: 'посещать занятия', example: 'Los estudiantes deben asistir a todas las clases.' },
        { term: 'tomar notas', translation: 'делать записи', example: 'Tomo notas durante las reuniones importantes.' },
        { term: 'dar una presentación', translation: 'делать презентацию', example: 'Mañana daré una presentación.' },
        { term: 'trabajar horas extra', translation: 'работать сверхурочно', example: 'A veces tengo que trabajar horas extra.' },
        { term: 'cumplir plazos', translation: 'соблюдать сроки', example: 'Es importante cumplir todos los plazos.' },
        { term: 'solicitar un trabajo', translation: 'подавать заявление на работу', example: 'Quiero solicitar este trabajo.' },
        { term: 'tener una entrevista', translation: 'проходить собеседование', example: 'Tengo una entrevista la próxima semana.' },
        { term: 'obtener un ascenso', translation: 'получать повышение', example: 'El trabajo duro puede ayudarte a obtener un ascenso.' },
        { term: 'jubilarse', translation: 'выходить на пенсию', example: 'Mi abuelo se jubilará el próximo año.' },
        { term: 'ganar dinero', translation: 'зарабатывать деньги', example: 'Todos necesitan ganar dinero para vivir.' },
        
        // Здоровье и спорт
        { term: 'sentirse enfermo', translation: 'чувствовать себя больным', example: 'Me siento enfermo hoy, así que me quedaré en casa.' },
        { term: 'ver a un médico', translation: 'обращаться к врачу', example: 'Deberías ver a un médico por esa tos.' },
        { term: 'tomar medicina', translation: 'принимать лекарство', example: 'Toma esta medicina tres veces al día.' },
        { term: 'hacer ejercicio regularmente', translation: 'регулярно заниматься спортом', example: 'Trato de hacer ejercicio regularmente para mantenerme saludable.' },
        { term: 'inscribirse en un gimnasio', translation: 'записаться в спортзал', example: 'Quiero inscribirme en un gimnasio cerca de mi casa.' },
        { term: 'salir a correr', translation: 'бегать трусцой', example: 'Salgo a correr cada mañana en el parque.' },
        { term: 'jugar tenis', translation: 'играть в теннис', example: '¿Quieres jugar tenis este fin de semana?' },
        { term: 'nadar vueltas', translation: 'плавать дорожки', example: 'Nado vueltas en la piscina local.' },
        { term: 'levantar pesas', translation: 'поднимать тяжести', example: 'Le gusta levantar pesas en el gimnasio.' },
        { term: 'estirar músculos', translation: 'растягивать мышцы', example: 'Siempre estira los músculos antes de hacer ejercicio.' },
        
        // Общение и отношения
        { term: 'hacer amigos', translation: 'заводить друзей', example: 'Es fácil hacer amigos cuando eres amable.' },
        { term: 'mantenerse en contacto', translation: 'поддерживать связь', example: 'Nos mantenemos en contacto a través de las redes sociales.' },
        { term: 'tener una discusión', translation: 'ссориться', example: 'A veces los amigos tienen discusiones.' },
        { term: 'disculparse', translation: 'извиняться', example: 'Necesito disculparme por llegar tarde.' },
        { term: 'perdonar a alguien', translation: 'прощать кого-то', example: 'Es importante perdonar a las personas.' },
        { term: 'enamorarse', translation: 'влюбляться', example: 'Se enamoraron a primera vista.' },
        { term: 'casarse', translation: 'жениться/выходить замуж', example: 'Planean casarse el próximo verano.' },
        { term: 'tener hijos', translation: 'иметь детей', example: 'Quieren tener hijos algún día.' },
        { term: 'celebrar cumpleaños', translation: 'праздновать дни рождения', example: 'Siempre celebramos cumpleaños con pastel.' },
        { term: 'invitar huéspedes', translation: 'приглашать гостей', example: 'Invitamos huéspedes a cenar los domingos.' },
        
        // Хобби и развлечения
        { term: 'coleccionar sellos', translation: 'коллекционировать марки', example: 'A mi abuelo le gusta coleccionar sellos.' },
        { term: 'jugar ajedrez', translation: 'играть в шахматы', example: 'El ajedrez ayuda a desarrollar el pensamiento estratégico.' },
        { term: 'resolver rompecabezas', translation: 'решать головоломки', example: 'Disfruto resolviendo crucigramas.' },
        { term: 'pintar cuadros', translation: 'рисовать картины', example: 'Le encanta pintar cuadros de la naturaleza.' },
        { term: 'tocar guitarra', translation: 'играть на гитаре', example: 'Estoy aprendiendo a tocar guitarra.' },
        { term: 'cantar canciones', translation: 'петь песни', example: 'Cantamos canciones alrededor de la fogata.' },
        { term: 'bailar salsa', translation: 'танцевать сальсу', example: 'Toman clases para bailar salsa.' },
        { term: 'leer novelas', translation: 'читать романы', example: 'Me encanta leer novelas de misterio.' },
        { term: 'ver películas', translation: 'смотреть фильмы', example: 'Vemos películas todos los viernes por la noche.' },
        { term: 'ir a conciertos', translation: 'ходить на концерты', example: 'Voy a conciertos siempre que es posible.' },
        
        // Технологии и интернет
        { term: 'enviar correos', translation: 'отправлять электронные письма', example: 'Envío correos a mis colegas diariamente.' },
        { term: 'navegar por internet', translation: 'просматривать интернет', example: 'Navego por internet para leer noticias.' },
        { term: 'descargar archivos', translation: 'скачивать файлы', example: 'Puedes descargar archivos de este sitio web.' },
        { term: 'subir fotos', translation: 'загружать фотографии', example: 'Subo fotos a las redes sociales.' },
        { term: 'hacer videollamadas', translation: 'общаться по видеосвязи', example: 'Hacemos videollamadas con la familia en el extranjero.' },
        { term: 'usar aplicaciones', translation: 'использовать приложения', example: 'Uso aplicaciones para aprender idiomas.' },
        { term: 'cargar dispositivos', translation: 'заряжать устройства', example: 'No olvides cargar tu teléfono.' },
        { term: 'respaldar datos', translation: 'создавать резервные копии данных', example: 'Siempre respalda los datos importantes.' },
        { term: 'actualizar software', translation: 'обновлять программное обеспечение', example: 'Actualiza tu software regularmente.' },
        { term: 'proteger privacidad', translation: 'защищать конфиденциальность', example: 'Es importante proteger tu privacidad en línea.' }
      ]
    },
    'B1': {
      'ru-en': [
        // Сложные действия и процессы
        { term: 'to take an exam', translation: 'сдавать экзамен', example: 'Tomorrow I will take a math exam.' },
        { term: 'to make a decision', translation: 'принимать решение', example: 'It is difficult for me to make important decisions.' },
        { term: 'to achieve success', translation: 'добиваться успеха', example: 'To achieve success, you need to work hard.' },
        { term: 'to deal with problems', translation: 'справляться с проблемами', example: 'He knows how to deal with any problems.' },
        { term: 'to develop skills', translation: 'развивать навыки', example: 'It is important to constantly develop your skills.' },
        { term: 'to pay attention', translation: 'обращать внимание', example: 'You need to pay attention to details.' },
        { term: 'to express opinion', translation: 'выражать мнение', example: 'Everyone has the right to express their opinion.' },
        { term: 'to maintain relationships', translation: 'поддерживать отношения', example: 'It is important to maintain good relationships with colleagues.' },
        { term: 'to overcome difficulties', translation: 'преодолевать трудности', example: 'We can overcome any difficulties together.' },
        { term: 'to reach goals', translation: 'достигать цели', example: 'To reach goals, you need motivation.' },
        
        // Профессиональная деятельность
        { term: 'to manage a team', translation: 'управлять командой', example: 'She learned to manage a team effectively.' },
        { term: 'to negotiate contracts', translation: 'вести переговоры по контрактам', example: 'Lawyers negotiate contracts for their clients.' },
        { term: 'to analyze data', translation: 'анализировать данные', example: 'Scientists analyze data to draw conclusions.' },
        { term: 'to implement strategies', translation: 'внедрять стратегии', example: 'Companies implement new strategies to grow.' },
        { term: 'to coordinate activities', translation: 'координировать деятельность', example: 'Project managers coordinate team activities.' },
        { term: 'to evaluate performance', translation: 'оценивать производительность', example: 'Managers evaluate employee performance annually.' },
        { term: 'to delegate responsibilities', translation: 'делегировать обязанности', example: 'Good leaders know how to delegate responsibilities.' },
        { term: 'to conduct research', translation: 'проводить исследования', example: 'Universities conduct research in various fields.' },
        { term: 'to present findings', translation: 'представлять результаты', example: 'Researchers present their findings at conferences.' },
        { term: 'to collaborate with others', translation: 'сотрудничать с другими', example: 'It\'s important to collaborate with team members.' },
        
        // Образование и развитие
        { term: 'to pursue education', translation: 'получать образование', example: 'Many adults pursue higher education.' },
        { term: 'to acquire knowledge', translation: 'приобретать знания', example: 'Reading helps you acquire new knowledge.' },
        { term: 'to master techniques', translation: 'овладевать техниками', example: 'Artists spend years mastering their techniques.' },
        { term: 'to enhance abilities', translation: 'улучшать способности', example: 'Practice helps enhance your abilities.' },
        { term: 'to expand understanding', translation: 'расширять понимание', example: 'Travel can expand your understanding of cultures.' },
        { term: 'to deepen expertise', translation: 'углублять экспертизу', example: 'Specialists work to deepen their expertise.' },
        { term: 'to broaden perspectives', translation: 'расширять перспективы', example: 'Education helps broaden your perspectives.' },
        { term: 'to cultivate talents', translation: 'развивать таланты', example: 'Schools should cultivate students\' talents.' },
        { term: 'to refine methods', translation: 'совершенствовать методы', example: 'Scientists constantly refine their research methods.' },
        { term: 'to strengthen foundations', translation: 'укреплять основы', example: 'Basic courses strengthen academic foundations.' },
        
        // Личностное развитие
        { term: 'to build confidence', translation: 'укреплять уверенность', example: 'Success helps build self-confidence.' },
        { term: 'to overcome fears', translation: 'преодолевать страхи', example: 'Therapy can help overcome deep-seated fears.' },
        { term: 'to embrace challenges', translation: 'принимать вызовы', example: 'Successful people embrace new challenges.' },
        { term: 'to adapt to changes', translation: 'адаптироваться к изменениям', example: 'Modern workers must adapt to technological changes.' },
        { term: 'to pursue passions', translation: 'следовать увлечениям', example: 'It\'s important to pursue your passions in life.' },
        { term: 'to maintain balance', translation: 'поддерживать баланс', example: 'Try to maintain work-life balance.' },
        { term: 'to establish priorities', translation: 'устанавливать приоритеты', example: 'Busy people need to establish clear priorities.' },
        { term: 'to cultivate patience', translation: 'развивать терпение', example: 'Meditation helps cultivate patience and mindfulness.' },
        { term: 'to foster creativity', translation: 'развивать креативность', example: 'Art classes foster creativity in children.' },
        { term: 'to nurture relationships', translation: 'развивать отношения', example: 'It takes effort to nurture meaningful relationships.' },
        
        // Социальные взаимодействия
        { term: 'to participate in discussions', translation: 'участвовать в дискуссиях', example: 'Students should participate actively in class discussions.' },
        { term: 'to contribute to society', translation: 'вносить вклад в общество', example: 'Volunteers contribute valuable time to society.' },
        { term: 'to influence decisions', translation: 'влиять на решения', example: 'Citizens can influence government decisions through voting.' },
        { term: 'to support causes', translation: 'поддерживать дела', example: 'Many celebrities support environmental causes.' },
        { term: 'to advocate for rights', translation: 'отстаивать права', example: 'Lawyers advocate for their clients\' rights.' },
        { term: 'to promote awareness', translation: 'повышать осведомлённость', example: 'Campaigns promote awareness about health issues.' },
        { term: 'to engage communities', translation: 'вовлекать сообщества', example: 'Local leaders work to engage their communities.' },
        { term: 'to bridge differences', translation: 'преодолевать различия', example: 'Diplomats work to bridge cultural differences.' },
        { term: 'to resolve conflicts', translation: 'разрешать конфликты', example: 'Mediators help resolve workplace conflicts.' },
        { term: 'to build consensus', translation: 'достигать консенсуса', example: 'Committee members work to build consensus on issues.' }
      ],
      'ru-es': [
        // Сложные действия и процессы
        { term: 'hacer un examen', translation: 'сдавать экзамен', example: 'Mañana haré un examen de matemáticas.' },
        { term: 'tomar una decisión', translation: 'принимать решение', example: 'Me es difícil tomar decisiones importantes.' },
        { term: 'lograr el éxito', translation: 'добиваться успеха', example: 'Para lograr el éxito, hay que trabajar mucho.' },
        { term: 'lidiar con problemas', translation: 'справляться с проблемами', example: 'Él sabe lidiar con cualquier problema.' },
        { term: 'desarrollar habilidades', translation: 'развивать навыки', example: 'Es importante desarrollar constantemente las habilidades.' },
        { term: 'prestar atención', translation: 'обращать внимание', example: 'Hay que prestar atención a los detalles.' },
        { term: 'expresar opinión', translation: 'выражать мнение', example: 'Todos tienen derecho a expresar su opinión.' },
        { term: 'mantener relaciones', translation: 'поддерживать отношения', example: 'Es importante mantener buenas relaciones con colegas.' },
        { term: 'superar dificultades', translation: 'преодолевать трудности', example: 'Podemos superar cualquier dificultad juntos.' },
        { term: 'alcanzar metas', translation: 'достигать цели', example: 'Para alcanzar metas, necesitas motivación.' },
        
        // Профессиональная деятельность
        { term: 'dirigir un equipo', translation: 'управлять командой', example: 'Ella aprendió a dirigir un equipo eficazmente.' },
        { term: 'negociar contratos', translation: 'вести переговоры по контрактам', example: 'Los abogados negocian contratos para sus clientes.' },
        { term: 'analizar datos', translation: 'анализировать данные', example: 'Los científicos analizan datos para sacar conclusiones.' },
        { term: 'implementar estrategias', translation: 'внедрять стратегии', example: 'Las empresas implementan nuevas estrategias para crecer.' },
        { term: 'coordinar actividades', translation: 'координировать деятельность', example: 'Los gerentes de proyecto coordinan las actividades del equipo.' },
        { term: 'evaluar rendimiento', translation: 'оценивать производительность', example: 'Los gerentes evalúan el rendimiento de los empleados anualmente.' },
        { term: 'delegar responsabilidades', translation: 'делегировать обязанности', example: 'Los buenos líderes saben cómo delegar responsabilidades.' },
        { term: 'realizar investigación', translation: 'проводить исследования', example: 'Las universidades realizan investigación en varios campos.' },
        { term: 'presentar hallazgos', translation: 'представлять результаты', example: 'Los investigadores presentan sus hallazgos en conferencias.' },
        { term: 'colaborar con otros', translation: 'сотрудничать с другими', example: 'Es importante colaborar con los miembros del equipo.' },
        
        // Образование и развитие
        { term: 'buscar educación', translation: 'получать образование', example: 'Muchos adultos buscan educación superior.' },
        { term: 'adquirir conocimiento', translation: 'приобретать знания', example: 'Leer te ayuda a adquirir nuevos conocimientos.' },
        { term: 'dominar técnicas', translation: 'овладевать техниками', example: 'Los artistas pasan años dominando sus técnicas.' },
        { term: 'mejorar habilidades', translation: 'улучшать способности', example: 'La práctica ayuda a mejorar tus habilidades.' },
        { term: 'ampliar comprensión', translation: 'расширять понимание', example: 'Viajar puede ampliar tu comprensión de las culturas.' },
        { term: 'profundizar experiencia', translation: 'углублять экспертизу', example: 'Los especialistas trabajan para profundizar su experiencia.' },
        { term: 'ampliar perspectivas', translation: 'расширять перспективы', example: 'La educación ayuda a ampliar tus perspectivas.' },
        { term: 'cultivar talentos', translation: 'развивать таланты', example: 'Las escuelas deben cultivar los talentos de los estudiantes.' },
        { term: 'refinar métodos', translation: 'совершенствовать методы', example: 'Los científicos refinan constantemente sus métodos de investigación.' },
        { term: 'fortalecer fundamentos', translation: 'укреплять основы', example: 'Los cursos básicos fortalecen los fundamentos académicos.' },
        
        // Личностное развитие
        { term: 'construir confianza', translation: 'укреплять уверенность', example: 'El éxito ayuda a construir autoconfianza.' },
        { term: 'superar miedos', translation: 'преодолевать страхи', example: 'La terapia puede ayudar a superar miedos profundos.' },
        { term: 'abrazar desafíos', translation: 'принимать вызовы', example: 'Las personas exitosas abrazan nuevos desafíos.' },
        { term: 'adaptarse a cambios', translation: 'адаптироваться к изменениям', example: 'Los trabajadores modernos deben adaptarse a cambios tecnológicos.' },
        { term: 'seguir pasiones', translation: 'следовать увлечениям', example: 'Es importante seguir tus pasiones en la vida.' },
        { term: 'mantener equilibrio', translation: 'поддерживать баланс', example: 'Trata de mantener el equilibrio trabajo-vida.' },
        { term: 'establecer prioridades', translation: 'устанавливать приоритеты', example: 'Las personas ocupadas necesitan establecer prioridades claras.' },
        { term: 'cultivar paciencia', translation: 'развивать терпение', example: 'La meditación ayuda a cultivar paciencia y atención plena.' },
        { term: 'fomentar creatividad', translation: 'развивать креативность', example: 'Las clases de arte fomentan la creatividad en los niños.' },
        { term: 'nutrir relaciones', translation: 'развивать отношения', example: 'Se necesita esfuerzo para nutrir relaciones significativas.' },
        
        // Социальные взаимодействия
        { term: 'participar en discusiones', translation: 'участвовать в дискуссиях', example: 'Los estudiantes deben participar activamente en las discusiones de clase.' },
        { term: 'contribuir a la sociedad', translation: 'вносить вклад в общество', example: 'Los voluntarios contribuyen tiempo valioso a la sociedad.' },
        { term: 'influir en decisiones', translation: 'влиять на решения', example: 'Los ciudadanos pueden influir en las decisiones del gobierno votando.' },
        { term: 'apoyar causas', translation: 'поддерживать дела', example: 'Muchas celebridades apoyan causas ambientales.' },
        { term: 'abogar por derechos', translation: 'отстаивать права', example: 'Los abogados abogan por los derechos de sus clientes.' },
        { term: 'promover conciencia', translation: 'повышать осведомлённость', example: 'Las campañas promueven conciencia sobre temas de salud.' },
        { term: 'involucrar comunidades', translation: 'вовлекать сообщества', example: 'Los líderes locales trabajan para involucrar a sus comunidades.' },
        { term: 'tender puentes', translation: 'преодолевать различия', example: 'Los diplomáticos trabajan para tender puentes entre diferencias culturales.' },
        { term: 'resolver conflictos', translation: 'разрешать конфликты', example: 'Los mediadores ayudan a resolver conflictos laborales.' },
        { term: 'construir consenso', translation: 'достигать консенсуса', example: 'Los miembros del comité trabajan para construir consenso sobre temas.' }
      ]
    },
    'B2': {
      'ru-en': [
        // Сложные идиомы и выражения
        { term: 'to weigh pros and cons', translation: 'взвешивать все за и против', example: 'Before buying a house, you need to weigh all the pros and cons.' },
        { term: 'to keep up with the times', translation: 'идти в ногу со временем', example: 'In the IT field, it is important to keep up with the times.' },
        { term: 'to take responsibility', translation: 'брать на себя ответственность', example: 'A leader must take responsibility for the team.' },
        { term: 'to find common ground', translation: 'находить общий язык', example: 'It is important to find common ground with colleagues.' },
        { term: 'to broaden horizons', translation: 'расширять кругозор', example: 'Travel helps broaden horizons.' },
        { term: 'to call into question', translation: 'ставить под сомнение', example: 'New data calls this theory into question.' },
        { term: 'to come to a conclusion', translation: 'приходить к выводу', example: 'After analysis, we come to the conclusion about the need for changes.' },
        { term: 'to take circumstances into account', translation: 'учитывать обстоятельства', example: 'When planning, you need to take all circumstances into account.' },
        { term: 'to strike a balance', translation: 'найти баланс', example: 'Companies must strike a balance between profit and social responsibility.' },
        { term: 'to make headway', translation: 'добиваться прогресса', example: 'The research team is making significant headway in cancer treatment.' },
        
        // Профессиональные навыки высокого уровня
        { term: 'to spearhead initiatives', translation: 'возглавлять инициативы', example: 'She was chosen to spearhead the company\'s sustainability initiatives.' },
        { term: 'to streamline processes', translation: 'оптимизировать процессы', example: 'The new software will streamline our workflow processes.' },
        { term: 'to leverage resources', translation: 'эффективно использовать ресурсы', example: 'Successful companies know how to leverage their resources effectively.' },
        { term: 'to foster innovation', translation: 'способствовать инновациям', example: 'The company culture fosters innovation and creative thinking.' },
        { term: 'to mitigate risks', translation: 'снижать риски', example: 'Insurance policies help mitigate financial risks.' },
        { term: 'to capitalize on opportunities', translation: 'использовать возможности', example: 'Smart investors capitalize on market opportunities.' },
        { term: 'to orchestrate campaigns', translation: 'организовывать кампании', example: 'The marketing team orchestrated a successful product launch campaign.' },
        { term: 'to navigate complexities', translation: 'справляться со сложностями', example: 'Experienced managers can navigate organizational complexities.' },
        { term: 'to synthesize information', translation: 'синтезировать информацию', example: 'Researchers must synthesize information from multiple sources.' },
        { term: 'to optimize performance', translation: 'оптимизировать производительность', example: 'Athletes work with coaches to optimize their performance.' },
        
        // Академические и интеллектуальные процессы
        { term: 'to scrutinize evidence', translation: 'тщательно изучать доказательства', example: 'Scientists scrutinize evidence before drawing conclusions.' },
        { term: 'to substantiate claims', translation: 'обосновывать утверждения', example: 'You need solid data to substantiate your claims.' },
        { term: 'to extrapolate trends', translation: 'экстраполировать тенденции', example: 'Economists extrapolate trends to predict future market behavior.' },
        { term: 'to corroborate findings', translation: 'подтверждать результаты', example: 'Independent studies corroborate the original research findings.' },
        { term: 'to refute arguments', translation: 'опровергать аргументы', example: 'The defense lawyer attempted to refute the prosecution\'s arguments.' },
        { term: 'to articulate concepts', translation: 'формулировать концепции', example: 'Good teachers can articulate complex concepts clearly.' },
        { term: 'to elucidate principles', translation: 'разъяснять принципы', example: 'The textbook elucidates fundamental principles of physics.' },
        { term: 'to postulate theories', translation: 'выдвигать теории', example: 'Scientists postulate theories to explain natural phenomena.' },
        { term: 'to validate hypotheses', translation: 'подтверждать гипотезы', example: 'Experiments are designed to validate or reject hypotheses.' },
        { term: 'to contextualize information', translation: 'контекстуализировать информацию', example: 'Historians contextualize events within their time periods.' }
      ]
    },
    'C1': {
      'ru-en': [
        // Продвинутые профессиональные выражения
        { term: 'to challenge established views', translation: 'подвергать сомнению устоявшиеся взгляды', example: 'Scientists must challenge established views to advance knowledge.' },
        { term: 'to learn from setbacks', translation: 'извлекать уроки из неудач', example: 'Successful entrepreneurs know how to learn from setbacks.' },
        { term: 'to adapt to changing conditions', translation: 'адаптироваться к изменяющимся условиям', example: 'Companies must adapt to changing market conditions.' },
        { term: 'to implement a comprehensive approach', translation: 'осуществлять комплексный подход', example: 'To solve environmental problems, a comprehensive approach is needed.' },
        { term: 'to promote sustainable development', translation: 'способствовать устойчивому развитию', example: 'New technologies should promote sustainable development.' },
        { term: 'to overcome cultural barriers', translation: 'преодолевать культурные барьеры', example: 'In international business, it is important to overcome cultural barriers.' },
        { term: 'to cultivate strategic partnerships', translation: 'развивать стратегические партнерства', example: 'Global companies cultivate strategic partnerships across continents.' },
        { term: 'to pioneer breakthrough innovations', translation: 'быть пионером прорывных инноваций', example: 'Tech giants pioneer breakthrough innovations that reshape industries.' },
        { term: 'to orchestrate transformational change', translation: 'организовывать трансформационные изменения', example: 'Visionary leaders orchestrate transformational change in organizations.' },
        { term: 'to navigate unprecedented challenges', translation: 'справляться с беспрецедентными вызовами', example: 'Modern leaders must navigate unprecedented global challenges.' }
      ]
    }
  };

  // Статическое хранилище для отслеживания уже выданных слов по сессиям
  private static sessionUsedWords: Map<string, Set<string>> = new Map();
  
  // Генерируем уникальный ключ сессии
  private static generateSessionKey(request: GenerationRequest): string {
    return `${request.knownLanguageCode}-${request.learningLanguageCode}-${request.userLevel}`;
  }

  private static readonly SAMPLE_IMAGES = [
    'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?w=400&h=300&fit=crop'
  ];

  static async generateWords(request: GenerationRequest): Promise<WordSuggestion[]> {
    console.log('🤖 AIWordGeneratorService: Starting generation with request:', request);
    console.log('🤖 AIWordGeneratorService: Available levels:', Object.keys(this.WORD_TEMPLATES));
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const sessionKey = this.generateSessionKey(request);
      const languagePairKey = `${request.knownLanguageCode}-${request.learningLanguageCode}`;
      
      console.log('🔑 Session key:', sessionKey);
      console.log('🌐 Language pair key:', languagePairKey);
      console.log('📚 User level:', request.userLevel);
      
      // Получаем шаблоны для уровня пользователя
      const levelTemplates = this.WORD_TEMPLATES[request.userLevel as keyof typeof this.WORD_TEMPLATES];
      console.log('📖 Level templates found:', !!levelTemplates);
      
      let templates: Array<{ term: string; translation: string; example: string }> = [];
      
      if (levelTemplates && levelTemplates[languagePairKey as keyof typeof levelTemplates]) {
        templates = levelTemplates[languagePairKey as keyof typeof levelTemplates];
        console.log(`✅ Found ${templates.length} templates for ${languagePairKey} at level ${request.userLevel}`);
      } else {
        // Fallback logic - ищем подходящие шаблоны
        console.log(`⚠️ No templates found for ${languagePairKey} at level ${request.userLevel}, using fallback`);
        
        // Пробуем найти шаблоны для этой языковой пары на уровне A1
        const fallbackLevel = this.WORD_TEMPLATES['A1'];
        if (fallbackLevel && fallbackLevel[languagePairKey as keyof typeof fallbackLevel]) {
          templates = fallbackLevel[languagePairKey as keyof typeof fallbackLevel];
          console.log(`🔄 Using A1 fallback: ${templates.length} templates`);
        } else {
          // Если не найдено, используем ru-en как последний fallback
          templates = this.WORD_TEMPLATES['A1']['ru-en'];
          console.log(`🔄 Using ru-en fallback: ${templates.length} templates`);
        }
      }

      if (!templates || templates.length === 0) {
        console.error('❌ No templates available after fallback');
        throw new Error('Нет доступных шаблонов слов для данной языковой пары');
      }

      return this.selectAndFormatWords(templates, request.existingWords, request.userLevel, sessionKey);

    } catch (error) {
      console.error('❌ Error generating words:', error);
      throw new Error('Не удалось сгенерировать слова. Попробуйте позже.');
    }
  }

  private static selectAndFormatWords(
    templates: Array<{ term: string; translation: string; example: string }>,
    existingWords: string[],
    userLevel: string,
    sessionKey: string
  ): WordSuggestion[] {
    console.log('📝 Selecting and formatting words from templates:', templates?.length || 0);
    console.log('🚫 Existing words to exclude:', existingWords);
    
    // Получаем уже использованные слова для этой сессии
    if (!this.sessionUsedWords.has(sessionKey)) {
      this.sessionUsedWords.set(sessionKey, new Set());
    }
    const sessionUsed = this.sessionUsedWords.get(sessionKey)!;
    console.log('📋 Previously used words in this session:', Array.from(sessionUsed));
    
    if (!templates || templates.length === 0) {
      console.error('❌ No templates available');
      return [];
    }
    
    // Объединяем существующие слова и уже использованные в сессии
    const allExcludedWords = [...existingWords, ...Array.from(sessionUsed)];
    console.log('🚫 All excluded words:', allExcludedWords);
    
    // Фильтруем доступные шаблоны
    const availableTemplates = templates.filter(template => 
      !allExcludedWords.some(existing => 
        existing.toLowerCase() === template.term.toLowerCase() ||
        existing.toLowerCase() === template.translation.toLowerCase()
      )
    );

    console.log('✅ Available templates after filtering:', availableTemplates.length);
    
    // Если доступных шаблонов мало, сбрасываем историю сессии
    if (availableTemplates.length < 10) {
      console.log('🔄 Not enough available templates, resetting session history');
      sessionUsed.clear();
      
      // Пересчитываем доступные шаблоны только с учетом существующих слов
      const resetAvailableTemplates = templates.filter(template => 
        !existingWords.some(existing => 
          existing.toLowerCase() === template.term.toLowerCase() ||
          existing.toLowerCase() === template.translation.toLowerCase()
        )
      );
      
      console.log('✅ Available templates after session reset:', resetAvailableTemplates.length);
      
      if (resetAvailableTemplates.length > 0) {
        return this.formatSelectedWords(resetAvailableTemplates, userLevel, sessionUsed);
      }
    }
    
    return this.formatSelectedWords(availableTemplates, userLevel, sessionUsed);
  }
  
  private static formatSelectedWords(
    availableTemplates: Array<{ term: string; translation: string; example: string }>,
    userLevel: string,
    sessionUsed: Set<string>
  ): WordSuggestion[] {
    // Перемешиваем и берем до 10 слов
    const shuffled = [...availableTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));
    
    // Добавляем выбранные слова в историю использованных для сессии
    selected.forEach(template => {
      sessionUsed.add(template.term.toLowerCase());
      sessionUsed.add(template.translation.toLowerCase());
    });
    
    console.log('🎯 Selected words for this generation:', selected.map(s => s.term));
    console.log('📚 Updated session used words:', Array.from(sessionUsed));

    const result = selected.map((template, index) => ({
      term: template.term,
      translation: template.translation,
      imageUrl: this.SAMPLE_IMAGES[index % this.SAMPLE_IMAGES.length],
      example: template.example,
      difficulty: userLevel
    }));
    
    console.log('✅ Final formatted words:', result);
    return result;
  }

  static getLevelDescription(level: string): string {
    const descriptions: Record<string, string> = {
      'A1': 'Базовые слова для повседневного общения',
      'A2': 'Полезная лексика для простых ситуаций',
      'B1': 'Устойчивые выражения и фразы',
      'B2': 'Сложные конструкции и идиомы',
      'C1': 'Продвинутая лексика и фразеологизмы',
      'C2': 'Профессиональная и академическая лексика'
    };
    return descriptions[level] || 'Подобранная лексика для вашего уровня';
  }

  static getThemeForLevel(level: string): string {
    const themes: Record<string, string> = {
      'A1': '🏠 Дом, семья и повседневная жизнь',
      'A2': '🌍 Путешествия, работа и хобби',
      'B1': '💼 Профессиональная деятельность и образование',
      'B2': '🎯 Сложные идиомы и выражения',
      'C1': '🧠 Продвинутая профессиональная лексика',
      'C2': '📚 Академическая и специализированная лексика'
    };
    return themes[level] || '📖 Общая лексика';
  }
  
  // Метод для сброса истории использованных слов сессии (для тестирования)
  static resetSessionWords(sessionKey?: string): void {
    if (sessionKey) {
      this.sessionUsedWords.delete(sessionKey);
      console.log(`🔄 Session words history for ${sessionKey} has been reset`);
    } else {
      this.sessionUsedWords.clear();
      console.log('🔄 All session words history has been reset');
    }
  }
  
  // Метод для получения статистики использованных слов
  static getUsageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.sessionUsedWords.forEach((words, sessionKey) => {
      stats[sessionKey] = words.size;
    });
    return stats;
  }
}