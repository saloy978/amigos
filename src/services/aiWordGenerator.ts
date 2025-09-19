import { ImageGenerationService } from './imageGenerationService';

interface WordSuggestion {
  term: string;
  translation: string;
  english?: string;
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
  topic?: string; // Необязательная тема для генерации слов
  imageGenerationSettings?: {
    style: string;
    enabledServices: string[];
  };
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
      ],
      'es-ru-en': [
        // Семья и люди - Испанский-Русский-Английский
        { term: 'madre', translation: 'мама', example: 'Mother is very kind.' },
        { term: 'padre', translation: 'папа', example: 'Father works in an office.' },
        { term: 'hermana', translation: 'сестра', example: 'Sister is younger than me.' },
        { term: 'hermano', translation: 'брат', example: 'Brother plays football.' },
        { term: 'abuela', translation: 'бабушка', example: 'Grandmother makes delicious cookies.' },
        { term: 'abuelo', translation: 'дедушка', example: 'Grandfather tells interesting stories.' },
        { term: 'bebé', translation: 'малыш', example: 'The baby is sleeping.' },
        { term: 'niño', translation: 'ребёнок', example: 'The child is playing in the park.' },
        { term: 'hombre', translation: 'мужчина', example: 'The man is reading a newspaper.' },
        { term: 'mujer', translation: 'женщина', example: 'The woman is cooking dinner.' },
        
        // Еда и напитки
        { term: 'manzana', translation: 'яблоко', example: 'I eat an apple every day.' },
        { term: 'plátano', translation: 'банан', example: 'Bananas are yellow and sweet.' },
        { term: 'naranja', translation: 'апельсин', example: 'I drink orange juice for breakfast.' },
        { term: 'pan', translation: 'хлеб', example: 'We buy fresh bread every morning.' },
        { term: 'leche', translation: 'молоко', example: 'Children drink milk to grow strong.' },
        { term: 'café', translation: 'кофе', example: 'I drink coffee in the morning.' },
        { term: 'té', translation: 'чай', example: 'Would you like some tea?' },
        { term: 'agua', translation: 'вода', example: 'Water is essential for life.' },
        { term: 'jugo', translation: 'сок', example: 'Apple juice is my favorite.' },
        { term: 'pastel', translation: 'торт', example: 'We eat cake on birthdays.' },
        { term: 'pizza', translation: 'пицца', example: 'Pizza is popular around the world.' },
        { term: 'pollo', translation: 'курица', example: 'Grilled chicken is healthy.' },
        { term: 'pescado', translation: 'рыба', example: 'Fish is good for your brain.' },
        { term: 'arroz', translation: 'рис', example: 'Rice is a staple food in Asia.' },
        { term: 'pasta', translation: 'паста', example: 'Italian pasta is delicious.' },
        
        // Животные
        { term: 'perro', translation: 'собака', example: 'Dogs are loyal companions.' },
        { term: 'gato', translation: 'кот', example: 'Cats are independent animals.' },
        { term: 'pájaro', translation: 'птица', example: 'Birds can fly in the sky.' },
        { term: 'pez', translation: 'рыба', example: 'Fish live in water.' },
        { term: 'caballo', translation: 'лошадь', example: 'Horses are strong animals.' },
        { term: 'vaca', translation: 'корова', example: 'Cows give us milk.' },
        { term: 'cerdo', translation: 'свинья', example: 'Pigs are intelligent animals.' },
        { term: 'oveja', translation: 'овца', example: 'Sheep provide wool for clothing.' },
        { term: 'conejo', translation: 'кролик', example: 'Rabbits hop quickly.' },
        { term: 'ratón', translation: 'мышь', example: 'The mouse is very small.' },
        
        // Дом и мебель
        { term: 'casa', translation: 'дом', example: 'Our house has a beautiful garden.' },
        { term: 'habitación', translation: 'комната', example: 'My room is on the second floor.' },
        { term: 'cocina', translation: 'кухня', example: 'We cook meals in the kitchen.' },
        { term: 'dormitorio', translation: 'спальня', example: 'I sleep in my bedroom.' },
        { term: 'baño', translation: 'ванная', example: 'The bathroom has a big mirror.' },
        { term: 'sala', translation: 'гостиная', example: 'We watch TV in the living room.' },
        { term: 'mesa', translation: 'стол', example: 'The table is in the kitchen.' },
        { term: 'silla', translation: 'стул', example: 'I sit on the chair.' },
        { term: 'cama', translation: 'кровать', example: 'The bed is very comfortable.' },
        { term: 'puerta', translation: 'дверь', example: 'The door is open.' },
        { term: 'ventana', translation: 'окно', example: 'The window is closed.' },
        { term: 'escalera', translation: 'лестница', example: 'The stairs are steep.' },
        
        // Цвета
        { term: 'rojo', translation: 'красный', example: 'Red is my favorite color.' },
        { term: 'azul', translation: 'синий', example: 'The sky is blue.' },
        { term: 'verde', translation: 'зелёный', example: 'Grass is green.' },
        { term: 'amarillo', translation: 'жёлтый', example: 'The sun is yellow.' },
        { term: 'negro', translation: 'чёрный', example: 'The cat is black.' },
        { term: 'blanco', translation: 'белый', example: 'Snow is white.' },
        { term: 'gris', translation: 'серый', example: 'The elephant is gray.' },
        { term: 'marrón', translation: 'коричневый', example: 'The tree is brown.' },
        { term: 'rosa', translation: 'розовый', example: 'The flower is pink.' },
        { term: 'naranja', translation: 'оранжевый', example: 'The carrot is orange.' },
        
        // Числа
        { term: 'uno', translation: 'один', example: 'I have one brother.' },
        { term: 'dos', translation: 'два', example: 'I have two sisters.' },
        { term: 'tres', translation: 'три', example: 'I have three books.' },
        { term: 'cuatro', translation: 'четыре', example: 'I have four pens.' },
        { term: 'cinco', translation: 'пять', example: 'I have five apples.' },
        { term: 'seis', translation: 'шесть', example: 'I have six cats.' },
        { term: 'siete', translation: 'семь', example: 'I have seven days.' },
        { term: 'ocho', translation: 'восемь', example: 'I have eight friends.' },
        { term: 'nueve', translation: 'девять', example: 'I have nine toys.' },
        { term: 'diez', translation: 'десять', example: 'I have ten fingers.' }
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

  // Тематические словари
  private static readonly TOPIC_WORDS = {
    'приветствия и прощания': [
      { term: 'hola', translation: 'привет', example: '¡Hola! ¿Cómo estás?' },
      { term: 'adiós', translation: 'до свидания', example: 'Adiós, nos vemos mañana.' },
      { term: 'buenos días', translation: 'доброе утро', example: 'Buenos días, ¿cómo amaneció?' },
      { term: 'buenas tardes', translation: 'добрый день', example: 'Buenas tardes, ¿cómo está?' },
      { term: 'buenas noches', translation: 'добрый вечер', example: 'Buenas noches, que descanse bien.' },
      { term: '¿qué tal?', translation: 'как дела?', example: '¿Qué tal tu día?' },
      { term: 'hasta luego', translation: 'до скорого', example: 'Hasta luego, cuídate mucho.' },
      { term: 'nos vemos', translation: 'увидимся', example: 'Nos vemos el próximo lunes.' },
      { term: 'saludos', translation: 'приветы', example: 'Saludos a toda la familia.' },
      { term: 'besos', translation: 'поцелуи', example: 'Besos y abrazos para todos.' }
    ],
    'знакомство и личная информация': [
      { term: 'nombre', translation: 'имя', example: 'Mi nombre es María.' },
      { term: 'edad', translation: 'возраст', example: 'Tengo veinticinco años.' },
      { term: 'profesión', translation: 'профессия', example: 'Mi profesión es ingeniera.' },
      { term: 'trabajo', translation: 'работа', example: 'Trabajo en una empresa grande.' },
      { term: 'estudios', translation: 'образование', example: 'Estudio medicina en la universidad.' },
      { term: 'nacionalidad', translation: 'национальность', example: 'Mi nacionalidad es española.' },
      { term: 'dirección', translation: 'адрес', example: 'Vivo en la calle Mayor, número 15.' },
      { term: 'teléfono', translation: 'телефон', example: 'Mi número de teléfono es 123-456-789.' },
      { term: 'email', translation: 'электронная почта', example: 'Mi email es maria@ejemplo.com.' },
      { term: 'cumpleaños', translation: 'день рождения', example: 'Mi cumpleaños es el 15 de marzo.' }
    ],
    'числа, даты, время': [
      { term: 'uno', translation: 'один', example: 'Tengo un hermano.' },
      { term: 'dos', translation: 'два', example: 'Son las dos de la tarde.' },
      { term: 'tres', translation: 'три', example: 'Vivo en el piso tres.' },
      { term: 'lunes', translation: 'понедельник', example: 'El lunes empiezo el trabajo.' },
      { term: 'martes', translation: 'вторник', example: 'Los martes voy al gimnasio.' },
      { term: 'enero', translation: 'январь', example: 'En enero hace mucho frío.' },
      { term: 'febrero', translation: 'февраль', example: 'Febrero es el mes más corto.' },
      { term: 'hora', translation: 'час', example: '¿Qué hora es?' },
      { term: 'minuto', translation: 'минута', example: 'Llego en cinco minutos.' },
      { term: 'segundo', translation: 'секунда', example: 'Espera un segundo, por favor.' }
    ],
    'семья и отношения': [
      { term: 'familia', translation: 'семья', example: 'Mi familia es muy grande.' },
      { term: 'padres', translation: 'родители', example: 'Mis padres viven en Madrid.' },
      { term: 'hermano', translation: 'брат', example: 'Mi hermano es mayor que yo.' },
      { term: 'hermana', translation: 'сестра', example: 'Mi hermana estudia en Barcelona.' },
      { term: 'abuelos', translation: 'бабушка и дедушка', example: 'Mis abuelos son muy cariñosos.' },
      { term: 'primo', translation: 'двоюродный брат', example: 'Mi primo viene de visita.' },
      { term: 'amigo', translation: 'друг', example: 'Mi mejor amigo se llama Carlos.' },
      { term: 'novio', translation: 'парень', example: 'Mi novio es muy romántico.' },
      { term: 'novia', translation: 'девушка', example: 'Mi novia es muy inteligente.' },
      { term: 'hijo', translation: 'сын', example: 'Mi hijo tiene cinco años.' }
    ],
    'дом и жильё': [
      { term: 'casa', translation: 'дом', example: 'Vivo en una casa grande.' },
      { term: 'apartamento', translation: 'квартира', example: 'Mi apartamento está en el centro.' },
      { term: 'habitación', translation: 'комната', example: 'Mi habitación es muy cómoda.' },
      { term: 'cocina', translation: 'кухня', example: 'La cocina es muy moderna.' },
      { term: 'baño', translation: 'ванная', example: 'El baño está muy limpio.' },
      { term: 'sala', translation: 'гостиная', example: 'En la sala vemos televisión.' },
      { term: 'dormitorio', translation: 'спальня', example: 'El dormitorio es muy tranquilo.' },
      { term: 'mesa', translation: 'стол', example: 'La mesa está en la cocina.' },
      { term: 'silla', translation: 'стул', example: 'Me siento en la silla.' },
      { term: 'cama', translation: 'кровать', example: 'La cama es muy cómoda.' }
    ],
    'еда и напитки': [
      { term: 'desayuno', translation: 'завтрак', example: 'Como el desayuno a las 8 AM.' },
      { term: 'almuerzo', translation: 'обед', example: 'Almorzamos al mediodía.' },
      { term: 'cena', translation: 'ужин', example: 'La cena es a las 7 PM.' },
      { term: 'restaurante', translation: 'ресторан', example: 'Comemos en un restaurante bonito.' },
      { term: 'menú', translation: 'меню', example: 'Por favor, trae el menú.' },
      { term: 'camarero', translation: 'официант', example: 'El camarero es muy amable.' },
      { term: 'cuenta', translation: 'счёт', example: '¿Puedo tener la cuenta, por favor?' },
      { term: 'propina', translation: 'чаевые', example: 'Deja una propina por el buen servicio.' },
      { term: 'delicioso', translation: 'вкусный', example: '¡Esta comida está deliciosa!' },
      { term: 'hambriento', translation: 'голодный', example: 'Estoy muy hambriento.' }
    ],
    'магазины и покупки': [
      { term: 'tienda', translation: 'магазин', example: 'Voy a la tienda a comprar pan.' },
      { term: 'supermercado', translation: 'супермаркет', example: 'El supermercado está abierto hasta las 10 PM.' },
      { term: 'ropa', translation: 'одежда', example: 'Necesito comprar ropa nueva.' },
      { term: 'precio', translation: 'цена', example: '¿Cuál es el precio de esta camisa?' },
      { term: 'talla', translation: 'размер', example: '¿Qué talla necesitas?' },
      { term: 'color', translation: 'цвет', example: 'Me gusta el color azul.' },
      { term: 'zapatos', translation: 'обувь', example: 'Estos zapatos son muy cómodos.' },
      { term: 'camisa', translation: 'рубашка', example: 'La camisa blanca está de moda.' },
      { term: 'pantalones', translation: 'брюки', example: 'Los pantalones negros son elegantes.' },
      { term: 'vestido', translation: 'платье', example: 'El vestido rojo es muy bonito.' }
    ],
    'путешествия и транспорт': [
      { term: 'pasaporte', translation: 'паспорт', example: 'No olvides tu pasaporte.' },
      { term: 'billete', translation: 'билет', example: 'Necesito comprar un billete de avión.' },
      { term: 'hotel', translation: 'отель', example: 'Nos quedamos en un hotel bonito.' },
      { term: 'equipaje', translation: 'багаж', example: 'Mi equipaje es muy pesado.' },
      { term: 'maleta', translation: 'чемодан', example: 'Empaca tu maleta cuidadosamente.' },
      { term: 'aeropuerto', translation: 'аэропорт', example: 'El aeropuerto está muy ocupado.' },
      { term: 'vuelo', translation: 'рейс', example: 'Nuestro vuelo está retrasado.' },
      { term: 'vacaciones', translation: 'отпуск', example: 'Necesito vacaciones.' },
      { term: 'turismo', translation: 'туризм', example: 'El turismo es importante para la economía.' },
      { term: 'aventura', translation: 'приключение', example: 'Viajar es una gran aventura.' }
    ],
    'город и достопримечательности': [
      { term: 'ciudad', translation: 'город', example: 'Madrid es una ciudad muy grande.' },
      { term: 'calle', translation: 'улица', example: 'Vivo en la calle Mayor.' },
      { term: 'plaza', translation: 'площадь', example: 'La plaza está en el centro.' },
      { term: 'parque', translation: 'парк', example: 'El parque es muy bonito.' },
      { term: 'iglesia', translation: 'церковь', example: 'La iglesia es muy antigua.' },
      { term: 'museo', translation: 'музей', example: 'El museo tiene muchas obras de arte.' },
      { term: 'monumento', translation: 'памятник', example: 'El monumento es muy famoso.' },
      { term: 'edificio', translation: 'здание', example: 'Este edificio es muy alto.' },
      { term: 'dirección', translation: 'направление', example: '¿Puedes darme la dirección?' },
      { term: 'mapa', translation: 'карта', example: 'Necesito un mapa de la ciudad.' }
    ],
    'здоровье и визит к врачу': [
      { term: 'médico', translation: 'врач', example: 'Voy al médico mañana.' },
      { term: 'hospital', translation: 'больница', example: 'El hospital está cerca de aquí.' },
      { term: 'farmacia', translation: 'аптека', example: 'La farmacia está abierta las 24 horas.' },
      { term: 'medicina', translation: 'лекарство', example: 'Necesito tomar esta medicina.' },
      { term: 'dolor', translation: 'боль', example: 'Tengo dolor de cabeza.' },
      { term: 'enfermedad', translation: 'болезнь', example: 'La enfermedad es muy grave.' },
      { term: 'síntoma', translation: 'симптом', example: 'Los síntomas son fiebre y tos.' },
      { term: 'cita', translation: 'приём', example: 'Tengo cita con el dentista.' },
      { term: 'salud', translation: 'здоровье', example: 'La salud es lo más importante.' },
      { term: 'ejercicio', translation: 'упражнение', example: 'Hacer ejercicio es bueno para la salud.' }
    ],
    'работа и профессии': [
      { term: 'oficina', translation: 'офис', example: 'Trabajo en una oficina grande.' },
      { term: 'reunión', translation: 'встреча', example: 'Tenemos una reunión a las 3 PM.' },
      { term: 'proyecto', translation: 'проект', example: 'Este proyecto es muy importante.' },
      { term: 'fecha límite', translation: 'срок', example: 'La fecha límite es el próximo viernes.' },
      { term: 'colega', translation: 'коллега', example: 'Mi colega es muy útil.' },
      { term: 'jefe', translation: 'начальник', example: 'Mi jefe es muy comprensivo.' },
      { term: 'salario', translation: 'зарплата', example: 'Recibo mi salario mensualmente.' },
      { term: 'entrevista', translation: 'собеседование', example: 'Tengo una entrevista mañana.' },
      { term: 'currículum', translation: 'резюме', example: 'Por favor, envía tu currículum.' },
      { term: 'carrera', translation: 'карьера', example: 'Quiero construir mi carrera.' }
    ],
    'учёба и языки': [
      { term: 'escuela', translation: 'школа', example: 'Voy a la escuela todos los días.' },
      { term: 'universidad', translation: 'университет', example: 'Estudio en la universidad.' },
      { term: 'profesor', translation: 'учитель', example: 'Mi profesor es muy bueno.' },
      { term: 'estudiante', translation: 'студент', example: 'Soy estudiante de medicina.' },
      { term: 'clase', translation: 'урок', example: 'La clase de español es muy interesante.' },
      { term: 'examen', translation: 'экзамен', example: 'Tengo un examen mañana.' },
      { term: 'tarea', translation: 'домашнее задание', example: 'La tarea es muy difícil.' },
      { term: 'libro', translation: 'книга', example: 'Necesito comprar un libro nuevo.' },
      { term: 'idioma', translation: 'язык', example: 'El español es un idioma hermoso.' },
      { term: 'aprender', translation: 'изучать', example: 'Quiero aprender español.' }
    ],
    'хобби и свободное время': [
      { term: 'fútbol', translation: 'футбол', example: 'El fútbol es muy popular.' },
      { term: 'baloncesto', translation: 'баскетбол', example: 'El baloncesto se juega con una pelota.' },
      { term: 'tenis', translation: 'теннис', example: 'Juego tenis cada fin de semana.' },
      { term: 'natación', translation: 'плавание', example: 'La natación es buen ejercicio.' },
      { term: 'correr', translation: 'бег', example: 'Correr me ayuda a mantenerme en forma.' },
      { term: 'gimnasio', translation: 'спортзал', example: 'Voy al gimnasio regularmente.' },
      { term: 'entrenamiento', translation: 'тренировка', example: 'El entrenamiento es duro pero gratificante.' },
      { term: 'competición', translation: 'соревнование', example: 'La competición es mañana.' },
      { term: 'campeón', translation: 'чемпион', example: 'Él es un campeón mundial.' },
      { term: 'medalla', translation: 'медаль', example: 'Ella ganó una medalla de oro.' }
    ],
    'погода и природа': [
      { term: 'montaña', translation: 'гора', example: 'La montaña es muy alta.' },
      { term: 'bosque', translation: 'лес', example: 'Caminamos por el bosque.' },
      { term: 'océano', translation: 'океан', example: 'El océano es muy profundo.' },
      { term: 'río', translation: 'река', example: 'El río fluye hacia el mar.' },
      { term: 'lago', translation: 'озеро', example: 'El lago es muy tranquilo.' },
      { term: 'playa', translation: 'пляж', example: 'Nos relajamos en la playa.' },
      { term: 'desierto', translation: 'пустыня', example: 'El desierto es muy caliente.' },
      { term: 'isla', translation: 'остров', example: 'Visitamos una isla tropical.' },
      { term: 'valle', translation: 'долина', example: 'El valle es muy verde.' },
      { term: 'cascada', translation: 'водопад', example: 'La cascada es hermosa.' }
    ],
    'телефон и интернет': [
      { term: 'computadora', translation: 'компьютер', example: 'Trabajo en mi computadora.' },
      { term: 'internet', translation: 'интернет', example: 'El internet es muy útil.' },
      { term: 'sitio web', translation: 'веб-сайт', example: 'Visito este sitio web diariamente.' },
      { term: 'correo electrónico', translation: 'электронная почта', example: 'Reviso mi correo electrónico regularmente.' },
      { term: 'teléfono inteligente', translation: 'смартфон', example: 'Mi teléfono inteligente es muy avanzado.' },
      { term: 'software', translation: 'программное обеспечение', example: 'Este software es fácil de usar.' },
      { term: 'aplicación', translation: 'приложение', example: 'Descargo una nueva aplicación.' },
      { term: 'contraseña', translation: 'пароль', example: 'No olvides tu contraseña.' },
      { term: 'base de datos', translation: 'база данных', example: 'La base de datos almacena información.' },
      { term: 'red', translation: 'сеть', example: 'La conexión de red es rápida.' }
    ],
    'эмоции и чувства': [
      { term: 'feliz', translation: 'счастливый', example: 'Estoy muy feliz hoy.' },
      { term: 'triste', translation: 'грустный', example: 'Me siento triste por la noticia.' },
      { term: 'enojado', translation: 'злой', example: 'Estoy enojado con mi hermano.' },
      { term: 'nervioso', translation: 'нервный', example: 'Estoy nervioso por el examen.' },
      { term: 'emocionado', translation: 'взволнованный', example: 'Estoy emocionado por el viaje.' },
      { term: 'sorprendido', translation: 'удивлённый', example: 'Estoy sorprendido por la noticia.' },
      { term: 'preocupado', translation: 'обеспокоенный', example: 'Estoy preocupado por mi salud.' },
      { term: 'relajado', translation: 'расслабленный', example: 'Me siento muy relajado.' },
      { term: 'cansado', translation: 'усталый', example: 'Estoy muy cansado después del trabajo.' },
      { term: 'enamorado', translation: 'влюблённый', example: 'Estoy enamorado de mi novia.' }
    ],
    'описание людей': [
      { term: 'alto', translation: 'высокий', example: 'Mi hermano es muy alto.' },
      { term: 'bajo', translation: 'низкий', example: 'Soy más bajo que mi padre.' },
      { term: 'delgado', translation: 'худой', example: 'Mi hermana es muy delgada.' },
      { term: 'gordo', translation: 'толстый', example: 'Mi tío es un poco gordo.' },
      { term: 'joven', translation: 'молодой', example: 'Ella es muy joven.' },
      { term: 'viejo', translation: 'старый', example: 'Mi abuelo es muy viejo.' },
      { term: 'bonito', translation: 'красивый', example: 'Ella es muy bonita.' },
      { term: 'feo', translation: 'уродливый', example: 'No es feo, solo diferente.' },
      { term: 'inteligente', translation: 'умный', example: 'Mi profesor es muy inteligente.' },
      { term: 'tonto', translation: 'глупый', example: 'No seas tonto, piensa bien.' }
    ],
    'описание предметов и мест': [
      { term: 'grande', translation: 'большой', example: 'Esta casa es muy grande.' },
      { term: 'pequeño', translation: 'маленький', example: 'El perro es muy pequeño.' },
      { term: 'nuevo', translation: 'новый', example: 'Compré un coche nuevo.' },
      { term: 'viejo', translation: 'старый', example: 'Este libro es muy viejo.' },
      { term: 'rápido', translation: 'быстрый', example: 'El tren es muy rápido.' },
      { term: 'lento', translation: 'медленный', example: 'El autobús es muy lento.' },
      { term: 'fácil', translation: 'лёгкий', example: 'Este ejercicio es muy fácil.' },
      { term: 'difícil', translation: 'трудный', example: 'El examen es muy difícil.' },
      { term: 'barato', translation: 'дешёвый', example: 'Esta camisa es muy barata.' },
      { term: 'caro', translation: 'дорогой', example: 'El restaurante es muy caro.' }
    ],
    'будущее и планы': [
      { term: 'futuro', translation: 'будущее', example: 'El futuro es incierto.' },
      { term: 'plan', translation: 'план', example: 'Tengo un plan para mañana.' },
      { term: 'sueño', translation: 'мечта', example: 'Mi sueño es viajar por el mundo.' },
      { term: 'meta', translation: 'цель', example: 'Mi meta es aprender español.' },
      { term: 'esperanza', translation: 'надежда', example: 'Tengo esperanza en el futuro.' },
      { term: 'intención', translation: 'намерение', example: 'Mi intención es ayudarte.' },
      { term: 'proyecto', translation: 'проект', example: 'Este proyecto es muy importante.' },
      { term: 'objetivo', translation: 'цель', example: 'Mi objetivo es graduarme.' },
      { term: 'ambición', translation: 'амбиция', example: 'Tengo mucha ambición.' },
      { term: 'deseo', translation: 'желание', example: 'Mi deseo es ser feliz.' }
    ],
    'культура и традиции': [
      { term: 'fiesta', translation: 'праздник', example: 'La fiesta de cumpleaños es mañana.' },
      { term: 'tradición', translation: 'традиция', example: 'Esta tradición es muy antigua.' },
      { term: 'costumbre', translation: 'обычай', example: 'Es una costumbre local.' },
      { term: 'cultura', translation: 'культура', example: 'La cultura española es muy rica.' },
      { term: 'religión', translation: 'религия', example: 'La religión es importante para muchos.' },
      { term: 'celebración', translation: 'празднование', example: 'La celebración es muy alegre.' },
      { term: 'ritual', translation: 'ритуал', example: 'Este ritual es muy especial.' },
      { term: 'festival', translation: 'фестиваль', example: 'El festival de música es genial.' },
      { term: 'ceremonia', translation: 'церемония', example: 'La ceremonia de graduación es emocionante.' },
      { term: 'herencia', translation: 'наследие', example: 'Esta herencia cultural es valiosa.' }
    ],
    'животные': [
      { term: 'perro', translation: 'собака', example: 'Mi perro es muy juguetón.' },
      { term: 'gato', translation: 'кот', example: 'El gato duerme en el sofá.' },
      { term: 'pájaro', translation: 'птица', example: 'El pájaro canta en el árbol.' },
      { term: 'pez', translation: 'рыба', example: 'Los peces nadan en el acuario.' },
      { term: 'caballo', translation: 'лошадь', example: 'El caballo galopa en el campo.' },
      { term: 'vaca', translation: 'корова', example: 'La vaca da leche fresca.' },
      { term: 'cerdo', translation: 'свинья', example: 'El cerdo vive en la granja.' },
      { term: 'oveja', translation: 'овца', example: 'La oveja tiene lana blanca.' },
      { term: 'conejo', translation: 'кролик', example: 'El conejo salta muy alto.' },
      { term: 'ratón', translation: 'мышь', example: 'El ratón es muy pequeño.' }
    ],
    'цвета': [
      { term: 'rojo', translation: 'красный', example: 'La manzana es roja.' },
      { term: 'azul', translation: 'синий', example: 'El cielo es azul.' },
      { term: 'verde', translation: 'зеленый', example: 'La hierba es verde.' },
      { term: 'amarillo', translation: 'желтый', example: 'El sol es amarillo.' },
      { term: 'negro', translation: 'черный', example: 'La noche es negra.' },
      { term: 'blanco', translation: 'белый', example: 'La nieve es blanca.' },
      { term: 'gris', translation: 'серый', example: 'Las nubes son grises.' },
      { term: 'marrón', translation: 'коричневый', example: 'El árbol es marrón.' },
      { term: 'rosa', translation: 'розовый', example: 'La flor es rosa.' },
      { term: 'naranja', translation: 'оранжевый', example: 'La naranja es naranja.' }
    ],
    'поход в магазин': [
      { term: 'tienda', translation: 'магазин', example: 'Voy a la tienda a comprar.' },
      { term: 'comprar', translation: 'покупать', example: 'Necesito comprar leche.' },
      { term: 'carrito', translation: 'корзина', example: 'Empujo el carrito por los pasillos.' },
      { term: 'caja', translation: 'касса', example: 'Pago en la caja registradora.' },
      { term: 'vendedor', translation: 'продавец', example: 'El vendedor me ayuda a encontrar productos.' },
      { term: 'precio', translation: 'цена', example: 'El precio está en la etiqueta.' },
      { term: 'descuento', translation: 'скидка', example: 'Hay un descuento del 20%.' },
      { term: 'recibo', translation: 'чек', example: 'Guardo el recibo de la compra.' },
      { term: 'bolsa', translation: 'пакет', example: 'Pongo las compras en la bolsa.' },
      { term: 'dinero', translation: 'деньги', example: 'Pago con dinero en efectivo.' }
    ]
  };

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
      // Изменяем логику: теперь используем формат "изучаемый-знаю-английский"
      // Например: "es-ru-en" для испанский-русский-английский
      const languagePairKey = `${request.learningLanguageCode}-${request.knownLanguageCode}-en`;
      
      console.log('🔑 Session key:', sessionKey);
      console.log('🌐 Language pair key (new format):', languagePairKey);
      console.log('📚 User level:', request.userLevel);
      
      let templates: Array<{ term: string; translation: string; example: string }> = [];
      
      // Проверяем, есть ли тема для генерации
      if (request.topic) {
        console.log(`🎯 Topic requested: "${request.topic}"`);
        const topicKey = request.topic.toLowerCase().trim();
        
        // Ищем тематические слова (точное совпадение)
        if (this.TOPIC_WORDS[topicKey as keyof typeof this.TOPIC_WORDS]) {
          templates = this.TOPIC_WORDS[topicKey as keyof typeof this.TOPIC_WORDS];
          console.log(`✅ Found ${templates.length} topic words for "${topicKey}"`);
        } else {
          // Нечеткий поиск по ключевым словам
          const fuzzyMatch = this.findTopicByKeywords(topicKey);
          if (fuzzyMatch) {
            templates = this.TOPIC_WORDS[fuzzyMatch as keyof typeof this.TOPIC_WORDS];
            console.log(`🔍 Fuzzy match found: "${topicKey}" → "${fuzzyMatch}" (${templates.length} words)`);
          } else {
            console.log(`⚠️ No topic words found for "${topicKey}", using general templates`);
          }
        }
      }
      
      // Если тематические слова не найдены, используем общие шаблоны
      if (templates.length === 0) {
        const levelTemplates = this.WORD_TEMPLATES[request.userLevel as keyof typeof this.WORD_TEMPLATES];
        console.log('📖 Level templates found:', !!levelTemplates);
        
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
            // Если не найдено, используем es-ru-en как последний fallback
            templates = this.WORD_TEMPLATES['A1']['es-ru-en'] || this.WORD_TEMPLATES['A1']['ru-en'];
            console.log(`🔄 Using es-ru-en fallback: ${templates.length} templates`);
            
            // Если и это не сработало, используем любые доступные шаблоны
            if (!templates || templates.length === 0) {
              console.log('🔄 No es-ru-en templates found, using any available A1 templates');
              const a1Templates = this.WORD_TEMPLATES['A1'];
              const availablePairs = Object.keys(a1Templates);
              if (availablePairs.length > 0) {
                templates = a1Templates[availablePairs[0] as keyof typeof a1Templates];
                console.log(`🔄 Using ${availablePairs[0]} templates: ${templates.length} templates`);
              }
            }
          }
        }
      }

      if (!templates || templates.length === 0) {
        console.error('❌ No templates available after fallback');
        throw new Error('Нет доступных шаблонов слов для данной языковой пары');
      }

      const languageSettings = { targetLanguage: request.learningLanguage };
      return await this.selectAndFormatWords(templates, request.existingWords, request.userLevel, sessionKey, languageSettings);

    } catch (error) {
      console.error('❌ Error generating words:', error);
      throw new Error('Не удалось сгенерировать слова. Попробуйте позже.');
    }
  }

  private static async selectAndFormatWords(
    templates: Array<{ term: string; translation: string; example: string }>,
    existingWords: string[],
    userLevel: string,
    sessionKey: string,
    languageSettings: { targetLanguage: string }
  ): Promise<WordSuggestion[]> {
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
    if (availableTemplates.length < 5) {
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
        return await this.formatSelectedWords(resetAvailableTemplates, userLevel, sessionUsed, languageSettings);
      }
    }
    
    return await this.formatSelectedWords(availableTemplates, userLevel, sessionUsed, languageSettings);
  }
  
  private static async formatSelectedWords(
    availableTemplates: Array<{ term: string; translation: string; example: string }>,
    userLevel: string,
    sessionUsed: Set<string>,
    languageSettings: { targetLanguage: string }
  ): Promise<WordSuggestion[]> {
    // Перемешиваем и берем до 15 слов (увеличено с 10)
    const shuffled = [...availableTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(15, shuffled.length));
    
    // Добавляем выбранные слова в историю использованных для сессии
    selected.forEach(template => {
      sessionUsed.add(template.term.toLowerCase());
      sessionUsed.add(template.translation.toLowerCase());
    });
    
    console.log('🎯 Selected words for this generation:', selected.map(s => s.term));
    console.log('📚 Updated session used words:', Array.from(sessionUsed));

    // Генерируем изображения для выбранных слов
    console.log('🎨 Generating images for selected words...');
    const result = await Promise.all(
      selected.map(async (template, index) => {
        // Для генерации изображений используем английское слово из примера
        const englishWord = this.extractEnglishWordFromExample(template.example);
        console.log(`🖼️ Generating image for "${template.term}" using English word: "${englishWord}"`);
        
        let imageUrl = this.SAMPLE_IMAGES[index % this.SAMPLE_IMAGES.length];
        
        // Проверяем настройки генерации изображений
        const shouldGenerateImage = this.shouldGenerateImage(request.imageGenerationSettings);
        
        if (shouldGenerateImage) {
          try {
            const imageResult = await ImageGenerationService.generateImage({
              word: englishWord,
              language: 'en', // Всегда используем английский для генерации изображений
              style: request.imageGenerationSettings?.style || 'cartoon'
            });
            
            if (imageResult.success && imageResult.imageUrl) {
              imageUrl = imageResult.imageUrl;
              console.log(`✅ Image generated for "${template.term}": ${imageUrl}`);
            } else {
              console.warn(`⚠️ Image generation failed for "${template.term}": ${imageResult.error}`);
            }
          } catch (error) {
            console.warn(`⚠️ Image generation error for "${template.term}":`, error);
          }
        } else {
          console.log(`⏭️ Skipping image generation for "${template.term}" - all services disabled`);
        }
        
        return {
          term: template.term,
          translation: template.translation,
          english: englishWord,
          imageUrl: imageUrl,
          example: template.example,
          difficulty: userLevel
        };
      })
    );
    
    console.log('✅ Final formatted words with images:', result);
    return result;
  }

  /**
   * Находит тему по ключевым словам (нечеткий поиск)
   */
  private static findTopicByKeywords(topicKey: string): string | null {
    const availableTopics = Object.keys(this.TOPIC_WORDS);
    
    // Словарь синонимов и ключевых слов
    const keywordMap: Record<string, string[]> = {
      'магазин': ['магазины и покупки', 'поход в магазин'],
      'покупки': ['магазины и покупки', 'поход в магазин'],
      'покупка': ['магазины и покупки', 'поход в магазин'],
      'поход': ['поход в магазин'],
      'еда': ['еда и напитки'],
      'напитки': ['еда и напитки'],
      'семья': ['семья и отношения'],
      'отношения': ['семья и отношения'],
      'дом': ['дом и жильё'],
      'жильё': ['дом и жильё'],
      'путешествия': ['путешествия и транспорт'],
      'транспорт': ['путешествия и транспорт'],
      'работа': ['работа и профессии'],
      'профессии': ['работа и профессии'],
      'учёба': ['учёба и языки'],
      'языки': ['учёба и языки'],
      'хобби': ['хобби и свободное время'],
      'свободное время': ['хобби и свободное время'],
      'погода': ['погода и природа'],
      'природа': ['погода и природа'],
      'здоровье': ['здоровье и визит к врачу'],
      'врач': ['здоровье и визит к врачу'],
      'эмоции': ['эмоции и чувства'],
      'чувства': ['эмоции и чувства'],
      'цвета': ['цвета'],
      'животные': ['животные']
    };
    
    // Ищем по ключевым словам
    for (const [keyword, topics] of Object.entries(keywordMap)) {
      if (topicKey.includes(keyword)) {
        // Возвращаем первую подходящую тему
        const matchingTopic = topics.find(topic => availableTopics.includes(topic));
        if (matchingTopic) {
          return matchingTopic;
        }
      }
    }
    
    // Если не найдено по ключевым словам, ищем частичное совпадение
    for (const topic of availableTopics) {
      const topicWords = topic.split(' ');
      const inputWords = topicKey.split(' ');
      
      // Проверяем, есть ли общие слова
      const commonWords = topicWords.filter(word => 
        inputWords.some(inputWord => 
          word.includes(inputWord) || inputWord.includes(word)
        )
      );
      
      if (commonWords.length > 0) {
        return topic;
      }
    }
    
    return null;
  }

  /**
   * Проверяет, нужно ли генерировать изображения на основе настроек
   */
  private static shouldGenerateImage(imageSettings?: {
    style: string;
    enabledServices: string[];
  }): boolean {
    if (!imageSettings || !imageSettings.enabledServices) {
      // Если настройки не переданы, используем значения по умолчанию
      return true;
    }
    
    // Проверяем, есть ли хотя бы один включенный сервис
    const hasEnabledServices = imageSettings.enabledServices.length > 0;
    
    if (!hasEnabledServices) {
      console.log('🚫 Image generation disabled - no services enabled');
      return false;
    }
    
    // Проверяем, что включен хотя бы один реальный сервис (не только Fallback)
    const hasRealServices = imageSettings.enabledServices.some(service => 
      service !== 'Fallback' && service !== 'Unsplash' && service !== 'Pexels' && service !== 'Pixabay' && service !== 'Craiyon'
    );
    
    if (!hasRealServices) {
      console.log('🚫 Image generation disabled - only fallback services enabled');
      return false;
    }
    
    return true;
  }

  /**
   * Извлекает английское слово из примера предложения
   */
  private static extractEnglishWordFromExample(example: string): string {
    // Примеры имеют формат: "Mother is very kind." или "I eat an apple every day."
    // Извлекаем первое существительное или основное слово
    const words = example.toLowerCase()
      .replace(/[.,!?;:]/g, '') // Убираем знаки препинания
      .split(' ')
      .filter(word => word.length > 2) // Убираем короткие слова
      .filter(word => !['the', 'and', 'are', 'is', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'may', 'might'].includes(word)); // Убираем служебные слова
    
    // Возвращаем первое подходящее слово
    return words[0] || 'object';
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

  // Получить список доступных тем
  static getAvailableTopics(): string[] {
    return Object.keys(this.TOPIC_WORDS);
  }

  // Получить описание темы
  static getTopicDescription(topic: string): string {
    const descriptions: Record<string, string> = {
      'еда': '🍽️ Слова связанные с едой, ресторанами и кулинарией',
      'животные': '🐾 Названия животных и связанная с ними лексика',
      'путешествия': '✈️ Слова для путешествий, туризма и транспорта',
      'работа': '💼 Профессиональная лексика и офисная жизнь',
      'спорт': '⚽ Спортивные термины и физическая активность',
      'музыка': '🎵 Музыкальные инструменты, жанры и термины',
      'природа': '🌿 Природные объекты, пейзажи и экология',
      'технологии': '💻 Компьютеры, интернет и современные технологии',
      'поход в магазин': '🛒 Слова для похода в магазин и покупок'
    };
    return descriptions[topic] || `📚 Слова по теме "${topic}"`;
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