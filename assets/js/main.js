const proverbs = [
  {
    "somali": "Af daboolan waa dahab",
    "english": "A closed mouth is golden",
    "russian": "Закрытый рот — золото"
  },
  {
    "somali": "Nin aan garaneyn afkiisa, afkii ayaa wax ka garanaya",
    "english": "He who does not know his own tongue will be subjected to it",
    "russian": "Кто не знает своего языка, тому язык будет подчиняться"
  },
  {
    "somali": "Dhego la'aan waa dhagaxa anfac",
    "english": "Without ears, a rock is useless",
    "russian": "Без ушей камень бесполезен"
  },
  {
    "somali": "Biyo sacab ah ma qoda",
    "english": "Water collected in hands cannot dig",
    "russian": "Вода в ладонях не роет"
  },
  {
    "somali": "Hal abuur halku baro",
    "english": "Learn at one place of creativity",
    "russian": "Учись там, где творишь"
  },
  {
    "somali": "Nin aan la taliyin waa uun gaal",
    "english": "He who does not consult is nothing but a heathen",
    "russian": "Тот, кто не советуется, — лишь язычник"
  },
  {
    "somali": "Cadaab kuma jiro kuwaad caawiyahaad",
    "english": "No punishment for those you help",
    "russian": "Нет наказания за тех, кому ты помогаешь"
  },
  {
    "somali": "Waa garan ma alifney dhagax",
    "english": "We did not mine the stone we found",
    "russian": "Мы не добыли камень, который нашли"
  },
  {
    "somali": "Mar awoowgaaga ha dambayn",
    "english": "Do not disappoint your ancestors",
    "russian": "Не разочаровывай своих предков"
  },
  {
    "somali": "Geel baa god dheer ku qubay",
    "english": "The camel fell into a deep pit",
    "russian": "Верблюд упал в глубокую яму"
  },
  {
    "somali": "Nin collowgii meel dheer ka dhaca",
    "english": "A man should not fall far from his cook",
    "russian": "Человек не должен падать далеко от своего повара"
  },
  {
    "somali": "Dembi muquur maba galo",
    "english": "Strings of guilt cannot be hidden",
    "russian": "Нити вины не спрятать"
  },
  {
    "somali": "Aqoon la’aan waa iftiin la’aan",
    "english": "Without knowledge, there is no light",
    "russian": "Без знаний нет света"
  },
  {
    "somali": "Nin aan khabrin qof ma isku qabiiri karo",
    "english": "He who does not know a person cannot compare himself to them",
    "russian": "Кто не знает человека, тот не может с ним сравниваться"
  },
  {
    "somali": "Ilko aan la xannibi karin ma ridi karo",
    "english": "Without bridle you cannot control the teeth",
    "russian": "Без узды не обуздать зубы"
  },
  {
    "somali": "Geesi baaskiil ha la saarin",
    "english": "A hero should not be saddled on a bicycle",
    "russian": "Героя не стоит сажать на велосипед"
  },
  {
    "somali": "Beena ma dhalato maxaan beeriyaa",
    "english": "Why sow where no seed will grow",
    "russian": "Зачем сеять там, где ничего не вырастет"
  },
  {
    "somali": "Qalbi qoyan ma yimaado iftiin",
    "english": "A wet heart does not welcome light",
    "russian": "Влажное сердце не встречает свет"
  },
  {
    "somali": "Raxan iyo ragba meel is mari waayaan",
    "english": "Neither rain nor men can go everywhere",
    "russian": "Ни дождь, ни люди не могут быть везде"
  },
  {
    "somali": "Murugo hilib ma noqon karto",
    "english": "Sorrow cannot become flesh",
    "russian": "Горе не может стать плотью"
  },
  {
    "somali": "Hagal yar ayuu ka qoro buug weyn",
    "english": "A small hook can catch a big fish",
    "russian": "Маленький крючок может поймать большую рыбу"
  },
  {
    "somali": "Maalintii mudada dheer waa waran",
    "english": "Day after a long wait is an arrow",
    "russian": "День после долгого ожидания — это стрела"
  },
  {
    "somali": "Wadnaha ha kaaga sheegin quluub kale",
    "english": "Do not reveal your heart to others",
    "russian": "Не открывай свое сердце другим"
  },
  {
    "somali": "Fardo kala tag ma noqoto",
    "english": "Horses did not part ways",
    "russian": "Лошади не расходятся"
  }
];
    const p = proverbs[Math.floor(Math.random() * proverbs.length)];
    document.getElementById('proverb-somali').textContent = '"' + p.somali + '"';
    document.getElementById('proverb-english').textContent = '"' + p.english + '"';
    document.getElementById('proverb-russian').textContent = '"' + p.russian + '"';