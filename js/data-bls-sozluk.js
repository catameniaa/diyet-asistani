/* BLS aramasi için Türkçe → İngilizce sözlük.

   Neden: BLS 4.0 besin adları Almanca ve İngilizce. Diyetisyen "domates"
   yazınca "Tomato raw" bulunmalı. Sözlük ad ÇEVİRİSİ değildir, yalnızca
   arama içindir: bir Türkçe kelimenin BLS adlarında hangi İngilizce
   kelimelerle geçtiğini söyler. Her seçenek kelime başında aranır
   ("egg" → "Chicken egg raw" bulunur, "eggplant" değil). Gerekirse düzenli
   ifade parçası yazılır ('peas?\\b' bezelyeyi şeftaliden ayırır).

   Anahtarlar Türkçe küçük harfle yazılır; aramada Türkçe karakterler
   katlanır (ıspanak = ispanak, soğan = sogan). Birden çok kelimeli
   anahtarlar ("beyaz peynir") tek kelimelilerden önce eşleşir.

   İlk seçenek "asıl anlam"dır: aramada onunla eşleşen besin öne alınır
   ("yumurta" → önce tavuk yumurtası, yumurtalı makarna değil). grup: anahtarın
   doğal BLS grubu (kodun ilk harfi); o gruptaki besinler öne alınır ("süt"
   yazınca sütlü çikolata değil süt). BLS temel patatesi "Potatoe" diye yazıyor.

   Eşdeğer olmayan ürünler (kaşar, lor) BLS'de birebir yok; en yakın peynir
   türlerine yönlendirir, değer olarak aynı sayılmamalıdır. Bunlar arama
   sonucunun üstünde ayrıca uyarılır (yakin listesi). */
(function () {
  'use strict';
  DA.data.blsSozluk = {
    yakin: ['kaşar', 'lor', 'labne', 'kaymak', 'pastırma', 'sucuk', 'pekmez', 'helva', 'tarhana', 'levrek', 'kalamar', 'ahtapot'],
    /* harf → anahtarlar; bir anahtar birden çok grupta olabilir (fasulye: G ve H) */
    grup: {
      M: ['süt', 'yoğurt', 'ayran', 'kefir', 'peynir', 'beyaz peynir', 'kaşar', 'lor', 'labne', 'krem peynir', 'hellim',
        'krema', 'kaymak', 'süt tozu', 'peynir altı suyu'],
      V: ['tavuk', 'hindi', 'ördek', 'kaz', 'bıldırcın', 'tavşan', 'ciğer', 'böbrek', 'yürek', 'sakatat', 'göğüs', 'kanat', 'baget'],
      U: ['et', 'kırmızı et', 'dana', 'sığır', 'kuzu', 'koyun', 'keçi', 'kıyma', 'biftek', 'bonfile', 'antrikot', 'pirzola'],
      E: ['yumurta', 'yumurta akı', 'yumurta sarısı', 'makarna', 'erişte'],
      K: ['patates', 'mantar'],
      B: ['ekmek', 'simit'],
      C: ['buğday', 'arpa', 'yulaf', 'yulaf ezmesi', 'çavdar', 'mısır', 'pirinç', 'pilav', 'bulgur', 'irmik', 'kuskus', 'karabuğday',
        'darı', 'kinoa', 'un', 'kepek', 'müsli', 'mısır gevreği'],
      H: ['mercimek', 'nohut', 'fasulye', 'kuru fasulye', 'bakla', 'börülce', 'soya', 'tofu', 'bezelye', 'yer fıstığı', 'fıstık',
        'antep fıstığı', 'ceviz', 'fındık', 'badem', 'kaju', 'çam fıstığı', 'susam', 'keten', 'chia', 'humus', 'kestane',
        'hindistan cevizi', 'zeytin', 'kabak çekirdeği', 'ay çekirdeği', 'kuruyemiş'],
      G: ['fasulye', 'taze fasulye', 'bezelye', 'mısır', 'domates', 'salatalık', 'hıyar', 'biber', 'dolmalık biber', 'acı biber',
        'patlıcan', 'kabak', 'havuç', 'soğan', 'sarımsak', 'ıspanak', 'pırasa', 'lahana', 'kırmızı lahana', 'brokoli', 'karnabahar',
        'marul', 'roka', 'maydanoz', 'dereotu', 'fesleğen', 'kereviz', 'pancar', 'turp', 'enginar', 'bamya', 'semizotu', 'pazı',
        'kuşkonmaz', 'brüksel lahanası', 'şalgam', 'rezene', 'avokado', 'zencefil', 'ısırgan', 'kuzukulağı', 'tere', 'hindiba', 'sebze'],
      F: ['elma', 'armut', 'muz', 'portakal', 'limon', 'mandalina', 'greyfurt', 'üzüm', 'kuru üzüm', 'çilek', 'kiraz', 'vişne', 'şeftali',
        'kayısı', 'erik', 'incir', 'nar', 'ayva', 'kivi', 'ananas', 'karpuz', 'kavun', 'dut', 'ahududu', 'böğürtlen', 'yaban mersini',
        'kuşburnu', 'hurma', 'trabzon hurması', 'mango', 'frenk üzümü', 'bektaşi üzümü', 'turna yemişi', 'muşmula', 'nektarin', 'meyve'],
      T: ['balık', 'somon', 'alabalık', 'ton', 'uskumru', 'hamsi', 'sardalya', 'çipura', 'mezgit', 'morina', 'palamut', 'kalkan',
        'dil balığı', 'karides', 'mürekkep balığı', 'midye', 'istiridye', 'yengeç', 'ıstakoz', 'havyar', 'sazan', 'yayın', 'ringa',
        'deniz ürünleri'],
      Q: ['zeytinyağı', 'ayçiçek yağı', 'mısır yağı', 'fındık yağı', 'kanola', 'kolza', 'margarin', 'tereyağı', 'iç yağı', 'domuz yağı',
        'yağ', 'tahin'],
      S: ['şeker', 'bal', 'pekmez', 'reçel', 'çikolata', 'kakao', 'dondurma', 'şekerleme', 'tatlandırıcı'],
      N: ['su', 'çay', 'bitki çayı', 'kahve', 'maden suyu', 'kola', 'limonata', 'meyve suyu'],
      P: ['bira', 'şarap']
    },
    s: {
      /* hazırlama ve nitelik */
      'çiğ': 'raw', 'haşlanmış': 'boiled|poached', 'haşlama': 'boiled|poached', 'pişmiş': 'cooked|boiled',
      'kızartılmış': 'fried|deep-fried', 'kızartma': 'fried|deep-fried', 'ızgara': 'grilled', 'fırında': 'oven|baked',
      'fırın': 'oven|baked', 'buharda': 'steamed', 'kurutulmuş': 'dried', 'kuru': 'dried|dry', 'dondurulmuş': 'deep-frozen',
      'konserve': 'canned', 'füme': 'smoked', 'tütsülenmiş': 'smoked', 'salamura': 'pickled|brine', 'turşu': 'pickled|gherkin',
      'tuzlu': 'salted', 'tuzsuz': 'unsalted|without salt', 'şekerli': 'sweetened|sugared', 'şekersiz': 'unsweetened',
      'tam buğday': 'wholemeal', 'kepekli': 'wholemeal|bran', 'tam tahıllı': 'wholemeal|wholegrain|whole grain',
      'yağsız': 'lean|without fat|skimmed|low-fat', 'az yağlı': 'low-fat|semi-skimmed|reduced-fat', 'tam yağlı': 'whole',
      'derili': 'with skin', 'derisiz': 'without skin', 'kavrulmuş': 'roasted|toasted', 'toz': 'powder',
      'un': 'flour', 'püre': 'puree|mashed', 'suyu': 'juice', 'kızarmış': 'fried|toasted', 'haşlanmış yumurta': 'egg boiled',

      /* tahıllar */
      'buğday': 'wheat', 'arpa': 'barley', 'yulaf': 'oat', 'çavdar': 'rye', 'mısır': 'maize|sweetcorn|corn',
      'pirinç': 'white rice|rice', 'pilav': 'white rice|rice', 'bulgur': 'bulgur', 'irmik': 'semolina', 'kuskus': 'couscous',
      'karabuğday': 'buckwheat', 'darı': 'millet', 'kinoa': 'quinoa', 'ekmek': 'white bread|bread|roll|baguette|toast',
      'makarna': 'pasta|noodles', 'erişte': 'noodles|egg pasta', 'mısır gevreği': 'cornflakes',
      'müsli': 'muesli', 'galeta': 'crispbread|rusk', 'nişasta': 'starch', 'kepek': 'bran', 'simit': 'pretzel|roll',
      'yulaf ezmesi': 'oat flakes', 'kraker': 'cracker|crackerbread',

      /* baklagil, kuruyemiş, tohum */
      'mercimek': 'lentil mature|lentil', 'nohut': 'chickpea', 'fasulye': 'bean', 'kuru fasulye': 'haricot',
      'taze fasulye': 'bean green|green bean', 'bakla': 'broad bean', 'börülce': 'cowpea|black-eyed',
      'soya': 'soya|soy', 'tofu': 'tofu', 'bezelye': 'peas?\\b', 'yer fıstığı': 'peanut', 'fıstık': 'peanut|pistachio',
      'antep fıstığı': 'pistachio', 'ceviz': 'walnut', 'fındık': 'hazelnut', 'badem': 'almond', 'kaju': 'cashew',
      'çam fıstığı': 'pine', 'susam': 'sesame', 'keten': 'linseed|flax', 'chia': 'chia', 'tahin': 'tahini',
      'humus': 'hummus', 'kestane': 'chestnut', 'hindistan cevizi': 'coconut', 'zeytin': 'olive',
      'kabak çekirdeği': 'pumpkin seed', 'ay çekirdeği': 'sunflower seed', 'çekirdek': 'seed|kernel',
      'kuruyemiş': 'nut|almond|hazelnut|walnut|cashew|pistachio|peanut',

      /* sebzeler */
      'domates': 'tomato', 'salatalık': 'cucumber|gherkin', 'hıyar': 'cucumber|gherkin', 'biber': 'pepper|chilli',
      'dolmalık biber': 'sweet pepper', 'acı biber': 'chilli', 'patlıcan': 'aubergine', 'kabak': 'courgette|pumpkin',
      'havuç': 'carrot', 'soğan': 'onion|shallot', 'sarımsak': 'garlic', 'ıspanak': 'spinach', 'pırasa': 'leek',
      'lahana': 'cabbage|kale|savoy', 'kırmızı lahana': 'red cabbage', 'brokoli': 'broccoli', 'karnabahar': 'cauliflower',
      'marul': 'lettuce|cos|romaine', 'roka': 'rocket', 'maydanoz': 'parsley', 'dereotu': 'dill', 'nane': 'peppermint',
      'fesleğen': 'basil', 'kereviz': 'celeriac|celery', 'pancar': 'beet', 'turp': 'radish', 'enginar': 'artichoke',
      'bamya': 'okra', 'semizotu': 'purslane', 'pazı': 'chard', 'kuşkonmaz': 'asparagus',
      'mantar': 'mushroom|boletus|bolete|chanterelle|shiitake|morel|porcini', 'patates': 'potatoe\\b|potato',
      'tatlı patates': 'batata|sweet potato', 'brüksel lahanası': 'brussels', 'şalgam': 'turnip|swede',
      'rezene': 'fennel', 'avokado': 'avocado', 'zencefil': 'ginger', 'ısırgan': 'nettle', 'kuzukulağı': 'sorrel',
      'tere': 'cress', 'hindiba': 'chicory|endive|radicchio', 'sebze': 'vegetable', 'yeşil': 'green',
      'kırmızı': 'red', 'sarı': 'yellow', 'beyaz': 'white', 'siyah': 'black',

      /* meyveler */
      'elma': 'apple', 'armut': 'pear\\b|pears\\b', 'muz': 'banana', 'portakal': 'orange', 'limon': 'lemon',
      'mandalina': 'mandarin|tangerine|clementine|satsuma', 'greyfurt': 'grapefruit', 'üzüm': 'grape|raisin',
      'kuru üzüm': 'raisin', 'çilek': 'strawberry', 'kiraz': 'cherry|cherries', 'vişne': 'sour cherr',
      'şeftali': 'peach', 'kayısı': 'apricot', 'erik': 'plum|mirabelle|greengage|prune', 'incir': 'fig\\b',
      'nar': 'pomegranate', 'ayva': 'quince', 'kivi': 'kiwi', 'ananas': 'pineapple', 'karpuz': 'watermelon',
      'kavun': 'melon|honeydew|cantaloup', 'dut': 'mulberry', 'ahududu': 'raspberry', 'böğürtlen': 'blackberry',
      'yaban mersini': 'blueberry', 'kuşburnu': 'rose hip', 'hurma': 'date\\b', 'trabzon hurması': 'persimmon',
      'mango': 'mango', 'frenk üzümü': 'currant', 'bektaşi üzümü': 'gooseberry', 'turna yemişi': 'cranberry|lingonberry',
      'muşmula': 'medlar', 'nektarin': 'nectarine', 'meyve': 'fruit', 'meyve suyu': 'juice|nectar',

      /* süt ürünleri ve yumurta */
      'süt': 'whole milk|milk', 'yoğurt': 'yogurt', 'ayran': 'ayran', 'kefir': 'kefir',
      'peynir': 'cheese|quark|feta|halloumi|mozzarella|ricotta|gouda|edam|camembert|brie|cheddar',
      'beyaz peynir': 'brine cheese|feta', 'kaşar': 'semi-hard|gouda|edam|cheddar|tilsit', 'lor': 'ricotta|cottage',
      'labne': 'cream cheese', 'krem peynir': 'cream cheese', 'hellim': 'halloumi',
      'krema': 'cream', 'kaymak': 'cream', 'tereyağı': 'butter', 'süt tozu': 'milk powder',
      'peynir altı suyu': 'whey', 'yumurta': 'chicken egg|egg', 'yumurta akı': 'egg white', 'yumurta sarısı': 'egg yolk',
      'bitkisel': 'plant-based|vegan', 'badem sütü': 'almond drink', 'yulaf sütü': 'oat drink', 'soya sütü': 'soya drink',

      /* et, kümes hayvanı, sakatat */
      'et': 'meat|beef|veal|lamb|sheep|mutton', 'kırmızı et': 'beef|veal|lamb|sheep|mutton', 'dana': 'veal',
      'sığır': 'beef', 'kuzu': 'lamb', 'koyun': 'sheep|mutton', 'keçi': 'goat', 'kıyma': 'mince|minced',
      'biftek': 'steak', 'bonfile': 'tenderloin|fillet', 'antrikot': 'loin|rib', 'pirzola': 'chop',
      'but': 'leg|thigh|drumstick|round', 'ciğer': 'liver', 'böbrek': 'kidney(?! bean)', 'dil': 'tongue', 'yürek': 'heart',
      'işkembe': 'tripe', 'beyin': 'brain', 'tavuk': 'chicken meat|chicken', 'hindi': 'turkey', 'ördek': 'duck', 'kaz': 'goose',
      'bıldırcın': 'quail', 'tavşan': 'rabbit|hare', 'göğüs': 'breast', 'kanat': 'wing', 'baget': 'drumstick',
      'sakatat': 'liver|kidney|heart|tongue|tripe|giblets', 'sosis': 'sausage|vienna|frankfurt',
      'salam': 'salami|bologna', 'sucuk': 'sausage|salami', 'jambon': 'ham\\b', 'domuz': 'pork',
      'köfte': 'patty|patties|meatball|burger', 'döner': 'doner', 'kebap': 'kebab|doner',

      /* balık ve deniz ürünleri */
      'balık': 'fish|salmon|trout|cod|tuna|mackerel|herring|sardine|anchovy|bream|hake|sole|carp|perch',
      'somon': 'salmon', 'alabalık': 'trout', 'ton': 'tuna|bonito|albacore|yellowfin', 'uskumru': 'mackerel',
      'hamsi': 'anchovy', 'sardalya': 'sardine', 'çipura': 'bream', 'mezgit': 'whiting',
      'morina': 'cod\\b', 'palamut': 'bonito', 'kalkan': 'turbot', 'dil balığı': 'sole\\b', 'karides': 'shrimp|prawn',
      'mürekkep balığı': 'cuttlefish', 'midye': 'mussel', 'istiridye': 'oyster',
      'yengeç': 'crab', 'ıstakoz': 'lobster', 'havyar': 'caviar|roe', 'sazan': 'carp', 'yayın': 'catfish',
      'ringa': 'herring', 'deniz ürünleri': 'shellfish|frutti di mare|mussel|shrimp',

      /* yağlar */
      'zeytinyağı': 'olive oil', 'ayçiçek yağı': 'sunflower oil', 'mısır yağı': 'corn oil',
      'fındık yağı': 'hazelnut oil', 'kanola': 'rapeseed|canola', 'kolza': 'rapeseed', 'margarin': 'margarine',
      'iç yağı': 'tallow', 'domuz yağı': 'lard', 'yağ': 'oil|fat|butter|lard|margarine',

      /* şekerli ürünler */
      'şeker': 'sugar', 'bal': 'honey', 'pekmez': 'molasses|treacle|syrup', 'reçel': 'jam|preserve',
      'çikolata': 'chocolate', 'kakao': 'cocoa', 'dondurma': 'ice cream|sorbet',
      'bisküvi': 'biscuit|cookie', 'kurabiye': 'cookie|biscuit', 'kek': 'cake|sponge', 'pasta': 'torte|cake',
      'baklava': 'baklava', 'sütlaç': 'rice pudding', 'muhallebi': 'pudding|flummery',
      'tatlandırıcı': 'sweetener', 'şekerleme': 'candy|confectionery|sweets',

      /* içecekler */
      'su': 'water\\b', 'çay': 'tea', 'bitki çayı': 'herbal tea', 'kahve': 'coffee|espresso|cappuccino',
      'maden suyu': 'mineral water', 'kola': 'cola', 'bira': 'beer', 'şarap': 'wine', 'limonata': 'lemonade',
      'smoothie': 'smoothie', 'sporcu içeceği': 'isotonic',

      /* diğer */
      'tuz': 'salt\\b', 'sirke': 'vinegar', 'ketçap': 'ketchup', 'mayonez': 'mayonnaise', 'hardal': 'mustard',
      'maya': 'yeast', 'jelatin': 'gelatine|gelatin', 'tarçın': 'cinnamon', 'karabiber': 'pepper black',
      'çorba': 'soup|stew', 'salata': 'salad', 'sos': 'sauce|dressing', 'pizza': 'pizza', 'hamburger': 'burger|hamburger',
      'tost': 'toast', 'sandviç': 'sandwich|roll with', 'patates kızartması': 'french fries|fries|chips',
      'cips': 'crisps|chips', 'patlamış mısır': 'popcorn', 'bebek maması': 'baby food'
    }
  };
})();
