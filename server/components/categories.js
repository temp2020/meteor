import { Meteor } from 'meteor/meteor';

// Products data. Initiate on startup.
if (Products.find().count() === 0) {
console.log('Loading Products data.');
  let products = [
      {
        name: {
          en: 'Man',
          ar: 'الرجال',
          fr: 'Homme',
          es: 'Hombre',
          nl: 'Man',
          it: 'Uomo',
          de: 'Man',
          ru: 'мужчина',
          pt: 'Homem',
          jp: 'おとこ',
          zhs: '人',
          zht: '人',
          sw: 'Mtu',
          hi: 'आदमी'

        },
        image: '/images/1man.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: {
          en: 'Woman',
          ar: 'النساء',
          fr: 'Femme',
          es: 'Mujer',
          nl: 'Vrouw',
          it: 'Donna',
          de: 'Frau',
          ru: 'Женщина',
          pt: 'Mulher',
          jp: '女性',
          zhs: '女人',
          zht: '女人',
          sw: 'Mwanamke',
          hi: 'महिला'

        },
        image: '/images/2woman.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: {
          en: 'Children',
          ar: 'الأطفال',
          fr: 'Enfants',
          es: 'Niños',
          nl: 'Kinderen',
          it: 'Bambini',
          de: 'Kinder',
          ru: 'Дети',
          pt: 'Crianças',
          jp: '子供',
          zhs: '孩子',
          zht: '孩子',
          sw: 'Watoto',
          hi: 'बच्चे'

        },
        image: '/images/3children.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: {
          en: 'Sports and Leisure',
          ar: 'الرياضة والترفيه',
          fr: 'Sports et Loisirs',
          es: 'Deportes y Ocio',
          nl: 'Sport en vrije tijd',
          it: 'Sport e tempo libero',
          de: 'Sport und Freizeit',
          ru: 'Спорт и Отдых',
          pt: 'Esporte e Lazer',
          jp: 'スポーツとレジャー',
          zhs: '运动休闲',
          zht: '運動休閒',
          sw: 'Michezo na burudani',
          hi: 'खेल और आराम'

        },
        image: '/images/___sports-and-leisure.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
    {
        name: {
          en: 'Food and Health',
		      ar: 'الغذاء والصحة',
		      fr: 'Nourriture & Santé',
		      es: 'Comida y salud',
		      nl: 'Voedsel en gezondheid',
		      it: 'Cibo e salute',
		      de: 'Essen und Gesundheit',
		      ru: 'Пища и Здоровье',
		      pt: 'Alimentação e Saúde',
		      jp: '食べ物と健康',
		      zhs: '食物与健康',
		      zht: '食物與健康',
		      sw: 'Chakula na Afya',
		      hi: 'भोजन और स्वास्थ्य'

        },
        image: '/images/4food.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
	  {
        name: {
          en: 'Home and gardens',
		      ar: 'المنزل والحدائق',
		      fr: 'Maison et jardins',
		      es: 'Casa y jardines',
	      	nl: 'Huis en tuinen',
		      it: 'Casa e giardini',
	      	de: 'Haus und Garten',
	      	ru: 'Дом и сад',
	      	pt: 'Casa e jardins',
	      	jp: '家と庭園',
	      	zhs: '家和花园',
	      	zht: '家和花園',
	      	sw: 'Nyumba na bustani',
	      	hi: 'घर और बागीचे'

        },
        image: '/images/5home.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
          name: {
            en: 'Arts and Culture',
  		      ar: 'الفنون والثقافة',
  		      fr: 'Arts et Culture',
  		      es: 'Arte y Cultura',
  	      	nl: 'Kunst en cultuur',
  		      it: 'Arte e cultura',
  	      	de: 'Kunst und Kultur',
  	      	ru: 'Искусство и культура',
  	      	pt: 'Artes e Cultura',
  	      	jp: '芸術と文化',
  	      	zhs: '艺术与文化',
  	      	zht: '藝術與文化',
  	      	sw: 'Sanaa na Utamaduni',
  	      	hi: 'कला और संस्कृति'

          },
          image: '/images/arts-et-culture.jpg',
          listingsCount: 0,
          productOffersCount: 0,
          productSoldCount: 0
        },
        {
          name: {
        'en': 'Marble Stone Shopping market',
        'ar': 'سوق التسوق Global Stone',
        'fr': 'Centre commercial Global Stone',
        'es': 'Centro comercial Global Stone',
        'nl': 'Winkelmarkt Global Stone',
        'it': 'Mercato dello shopping Global Stone',
        'de': 'Einkaufsmarkt Global Stone',
        'ru': 'Торговый рынок Глобал Стоун',
        'pt': 'Mercado de Compras Global Stone',
        'jp': 'ショッピング市場 Global Stone',
        'zhs': '购物市场 全球石材',
        'zht': '購物市場 全球石材',
        'sw': 'Soko la Ununuzi Global Stone',
        'hi': 'शॉपिंग मार्केट Global Stone'

          },
          image: '/images/industries_extractives.jpg',
          listingsCount: 0,
          productOffersCount: 0,
          productSoldCount: 0
        },
        {
          name: {
            en: 'Office Building Services',
            ar: 'مبنى المكاتب',
            fr: 'Grand Immeuble de Bureaux',
            es: 'Gran edificio de oficinas',
            nl: 'Groot kantoorgebouw',
            it: 'Grande edificio per uffici',
            de: 'Großes Bürogebäude',
            ru: 'Большое офисное здание',
            pt: 'Grande edifício de escritórios',
            jp: '大規模オフィスビル',
            zhs: '大型办公大楼',
            zht: '大型辦公大樓',
            sw: 'Jengo kubwa la Ofisi',
            hi: 'बड़ा कार्यालय भवन'
  
          },
          image: '/images/cat_offices-torsades.png',
          listingsCount: 0,
          productOffersCount: 0,
          productSoldCount: 0
        },
	  {
        name: {
          en: 'Technology',
          ar:' التقنيات',
          fr: 'Technologie',
          es: 'Tecnología',
          nl: 'Technologie',
          it: 'Tecnologia',
          de: 'Technologie',
          ru: 'Технологии',
          pt: 'Tecnologia',
          jp: '技術',
          zhs: '技术',
          zht: '技術',
          sw: 'Teknolojia',
          hi: 'प्रौद्योगिकी'

        },
        image: '/images/6technology.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      }
  ];
  products.forEach(function(product){
    Products.insert(product);
  });
}

if( Currencies.find().count() === 0 ){
  let currencies = [
    "AUD",
    "BGN",
    "BRL",
    "CAD",
    "CHF",
    "CNY",
    "CZK",
    "DKK",
    "DZD",
    "EUR",
    "GBP",
    "HKD",
    "HRK",
    "HUF",
    "IDR",
    "ILS",
    "INR",
    "JPY",
    "KRW",
    "MAD",
    "MXN",
    "MYR",
    "NOK",
    "NZD",
    "PHP",
    "PLN",
    "RON",
    "RUB",
    "SEK",
    "SGD",
    "THB",
    "TND",
    "TRY",
    "USD",
    "XAF",
    "XOF",
    "ZAR"

  ]

  currencies.forEach((currency)=>{
    Currencies.insert({currency});
  });
}

if ( Packs.find().count() === 0 ){
  let packs = [{
    name: 'PACKS.STAR',
    googlePlayId: null,
    image: 'images/p1pack_fizz.jpg',
    listings: 60,
    expiryDays: 100,
    hasStore: false,
    isFree: true,
    price:[{
      currency: 'EUR',
      amount: 0
    }]
  },{
    name: 'PACKS.OPTIMA',
    googlePlayId: null,
    image: 'images/p2pack_star.jpg',
    listings: 6,
    expiryDays: 60,
    hasStore: true,
    isFree: true,
    price:[{
      currency: 'EUR',
      amount: 0
    }]
  },{
    name: 'PACKS.ULTIMO',
    googlePlayId: null,
    image: 'images/p3pack_tour.jpg',
    listings: 100,
    expiryDays: 6,
    hasStore: true,
    isFree: true,
    price:[{
      currency: 'EUR',
      amount: 0
    }]
  },{
    name: 'PACKS.INSIGHT',
    googlePlayId: 'pack_souiqa_insight',
    image: 'images/p4pack_root.jpg',
    listings: 250,
    expiryDays: 200,
    hasStore: true,
    isFree: false,
    price:[{
      currency: 'EUR',
      amount: 20
    }]
  },{
    name: 'PACKS.QI',
    googlePlayId: 'pack_souiqa_qi',
    image: 'images/p5pack_shop.jpg',
    listings: 900,
    expiryDays: 660,
    hasStore: true,
    isFree: false,
    price:[{
      currency: 'EUR',
      amount: 50
    }]
  },{
    name: 'PACKS.AZAL',
    googlePlayId: 'pack_souiqa_azal',
    image: 'images/p6pack_pro.jpg',
    listings: 3000,
    expiryDays: 900,
    hasStore: true,
    isFree: false,
    price:[{
      currency: 'EUR',
      amount: 100
    }]
  }]

  packs.forEach((pack)=>{

    Packs.insert(pack);

  });
}

if (Cards.find().count() === 0) {
  let cards = [
    { level: 1, listings: 1, coins: 10 },
    { level: 2, listings: 1, coins: 20 },
    { level: 3, listings: 1, coins: 30 },
    { level: 4, listings: 2, coins: 50 },
    { level: 5, listings: 3, coins: 80 },
    { level: 6, listings: 5, coins: 130 }
  ];

  cards.forEach((card)=>{

    Cards.insert(card);

  });
}

if ( SearchCards.find().count() === 0 ) {
  const searchCards = [
    { name: '300km', value: 300, cost: 0, expiryDays: null, freePack: 'PACKS.STAR' },
    { name: '500km', value: 500, cost: 1000, expiryDays: 90, freePack: 'PACKS.OPTIMA' },
    { name: '800km', value: 800, cost: 1000, expiryDays: 90, freePack: 'PACKS.ULTIMO' },
    { name: '2000km', value: 2000, cost: 2000, expiryDays: 120, freePack: 'PACKS.INSIGHT' },
    { name: '10000km', value: 10000, cost: 10000, expiryDays: 120, freePack: 'PACKS.QI' },
    { name: '20000km', value: 20000, cost: 20000, expiryDays: 120, freePack: 'PACKS.AZAL' }
  ];

  searchCards.forEach((card)=>{

    SearchCards.insert(card);

  });
}
