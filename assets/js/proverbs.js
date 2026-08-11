/* Пословицы, показываемые на сайте.
 *
 * ЭТОТ ФАЙЛ — ТОЛЬКО ДАННЫЕ. Кода здесь нет: список можно править, ничего
 * не сломав. Логика выборки лежит в main.js.
 *
 * Набор заменён 11.08.2026. Прежний (24 пословицы, июль 2025) был сверен
 * с корпусом Г. Л. Капчица: 22 из 24 в его работах не встречаются вовсе.
 * Здесь только засвидетельствованные, с авторскими английскими переводами:
 * шесть процитированы в статьях, опубликованных на этом сайте, остальные —
 * из собрания «Hubsiimo hal baa la siistaa» (Москва, 2002).
 *
 * Русские строки — рабочий перевод с авторского английского, а не изданные
 * русские версии Капчица.
 *
 * Как добавить пословицу: допишите объект в конец списка, соблюдая формат.
 * Обязательны все три поля. Источник обязателен: берите только из работ
 * Капчица, ничего не сочиняя — это сайт-канон.
 * Полное описание набора: .docs/proverbs.md
 */
const PROVERBS = [
  {
    "somali": "Soomaalidu been way sheegtaa, beense ma maahmaahdo",
    "english": "Somalis can lie, but their lie will never become a proverb",
    "russian": "Сомалийцы могут солгать, но их ложь никогда не станет пословицей"
  },
  {
    "somali": "Hubsiimo hal baa la siistaa",
    "english": "To know something for sure, one would even part with a she-camel",
    "russian": "За то, чтобы знать наверняка, не жаль отдать и верблюдицу"
  },
  {
    "somali": "Naagla'aani waa nafla'aan",
    "english": "If there is no woman there is no life",
    "russian": "Нет женщины — нет жизни"
  },
  {
    "somali": "Naag waa belaayo loo baahan yahay",
    "english": "Woman is a disaster one cannot do without",
    "russian": "Женщина — беда, без которой не обойтись"
  },
  {
    "somali": "Tuug wax ka tuhun badan",
    "english": "A thief is more suspicious than anyone else",
    "russian": "Вор подозрительнее всех прочих"
  },
  {
    "somali": "Subax iyo sadar, subax baa badan",
    "english": "Days (lit.: mornings) are more than lines (in the Koran)",
    "russian": "Дней (букв.: утр) больше, чем строк в Коране"
  },
  {
    "somali": "Aabbe, kan yar iga celiyoo kan weyn igu sii daa",
    "english": "Oh, father, save me from the small one, the big one I shall manage myself",
    "russian": "Отец, избавь меня от малого, а с большим я справлюсь сам"
  },
  {
    "somali": "Allow, nimaan wax ogayn ha cadaabin",
    "english": "Oh Allah, do not punish a man who sins through ignorance",
    "russian": "Аллах, не карай того, кто грешит по незнанию"
  },
  {
    "somali": "Doofaar ficilla'aan baa loo cadaabaa",
    "english": "A swine is cursed only because it is a swine",
    "russian": "Свинью проклинают лишь за то, что она свинья"
  },
  {
    "somali": "Hadal intuu uurkaaga ku jiro ayuu ammaan yahay",
    "english": "A word is yours while it is in your stomach",
    "russian": "Слово принадлежит тебе, пока оно у тебя внутри"
  },
  {
    "somali": "Hadal waa mergi hadba meel u jiidma",
    "english": "A word is like sinew: it stretches in every direction",
    "russian": "Слово как жила: тянется в любую сторону"
  },
  {
    "somali": "Mar i dage Alle ha dago, mar labaad i dagase anaa is dagay",
    "english": "If somebody cheated you once he is a fool, but if he cheated you twice you are a fool",
    "russian": "Обманул однажды — глупец он, обманул дважды — глупец ты"
  },
  {
    "somali": "Tuug tuug ma xado",
    "english": "One thief does not steal from another thief",
    "russian": "Вор у вора не крадёт"
  },
  {
    "somali": "Af daboolan waa dahab",
    "english": "A closed mouth is gold",
    "russian": "Закрытый рот — золото"
  },
  {
    "somali": "Ayax teg, eelna reeb",
    "english": "The locust flew away but it left hardship",
    "russian": "Саранча улетела, а беду оставила"
  },
  {
    "somali": "Intaadan falin ka fiirso",
    "english": "Think before you do something",
    "russian": "Подумай, прежде чем сделать"
  },
  {
    "somali": "Maroodigu takarta saaran ma arkee kan kale tan saaran ayuu arkaa",
    "english": "An elephant does not see the gadfly sitting on it but sees the one sitting on another elephant",
    "russian": "Слон не видит овода на себе, но видит того, что сидит на другом слоне"
  },
  {
    "somali": "Meel il laga la'yahay haddaad tagto, il baa layska ridaa",
    "english": "If you come to the one-eyed people's country, pull out your eye",
    "russian": "Придёшь в страну одноглазых — вынь себе глаз"
  },
  {
    "somali": "Nin aan kuu furi doonin yuu kuu rarin",
    "english": "He who is not going to unload your camel should not be the one to load it",
    "russian": "Кто не станет разгружать твоего верблюда, тому и не навьючивать его"
  },
  {
    "somali": "Nin bukaa boqol u talisay",
    "english": "A sick man has a hundred advisers",
    "russian": "У больного сто советчиков"
  },
  {
    "somali": "Baqal fardo la daaqday faras bay is mooddaa",
    "english": "If a mule grazes with horses it thinks that it is also a horse",
    "russian": "Мул, пасущийся с конями, считает себя конём"
  },
  {
    "somali": "Dhegi meel dheer bay ku dhacdaa, dhagaxna meel dhow",
    "english": "A stone flies near, a word far off",
    "russian": "Камень летит близко, а слово — далеко"
  },
  {
    "somali": "Been sheeg, laakiin been run u eg sheeg",
    "english": "Tell lies, but let your lies resemble the truth",
    "russian": "Лги, но пусть ложь твоя походит на правду"
  },
  {
    "somali": "Dhar magaalo intii laga xirto waa dhowdahay, dhal magaalase intii lagu noqdo waa dheer tahay",
    "english": "One can quickly put on town clothes, but it takes a long time to become a townsman",
    "russian": "Городскую одежду надеть быстро, а горожанином стать долго"
  }
];
    const p = proverbs[Math.floor(Math.random() * proverbs.length)];
