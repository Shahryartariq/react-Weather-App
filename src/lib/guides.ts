import type { ProvinceSlug } from "./cities";

/**
 * A few hand-written sentences on what makes each place's weather its own. This is what
 * separates a city page from a template with the name swapped. Numbers come from climate.json.
 */
export const CITY_GUIDES: Record<string, string> = {
  islamabad:
    "Islamabad sits on the Potohar Plateau at the foot of the Margalla Hills, so it has a real winter and one of the wettest monsoons of any large Pakistani city. Summer storms can arrive quickly and drop a lot of rain, and spring often brings hail.",
  lahore:
    "Lahore has hot summers, a humid monsoon from July to September, and cool, foggy winters. From about November to January, smog is the main weather story: still, cold air traps smoke and traffic fumes near the ground, and air quality can reach hazardous levels.",
  faisalabad:
    "Faisalabad lies on the flat plains of central Punjab, far from hills or sea. That means long, very hot summers, short mild winters and modest rain, most of it in the monsoon. Dense winter fog can close the motorways around the city.",
  rawalpindi:
    "Rawalpindi shares Islamabad's climate, with a cool winter and a strong monsoon. Cloudbursts are the main risk: the Nullah Leh, which runs through the city, can flood within hours of heavy rain.",
  multan:
    "Multan is known for heat and dust. Southern Punjab gets little rain, summers are among the hottest in the province, and dust storms are common before the monsoon. Winters are short and pleasant, with foggy mornings.",
  gujranwala:
    "Gujranwala lies between Lahore and Sialkot in the north of Punjab, so it gets more monsoon rain than the south of the province. In winter, fog and smog from the Lahore area often settle here too.",
  sialkot:
    "Sialkot sits close to the Himalayan foothills, which makes it one of the wetter cities in Punjab. Monsoon rain can be heavy, and the Chenab and the streams that feed it can flood in a strong season.",
  bahawalpur:
    "Bahawalpur is the gateway to the Cholistan Desert. Summers are very hot and dry and rain is scarce, while winter days are mild and clear. Dust is common in the hot months before the monsoon.",
  sargodha:
    "Sargodha lies on the plains between the Jhelum and Chenab rivers, at the centre of Pakistan's kinnow citrus farming. Summers are hot, winters are cool with foggy mornings, and the monsoon brings most of the rain.",
  sahiwal:
    "Sahiwal is in the farming country between Lahore and Multan. Summers are hot, the monsoon brings most of the year's rain, and winter mornings are often foggy.",
  "rahim-yar-khan":
    "Rahim Yar Khan, at the southern end of Punjab near the Sindh border, is one of the hottest cities in the province. The Cholistan Desert lies to the east, and rain is rare outside the monsoon.",
  gujrat:
    "Gujrat lies between the Jhelum and Chenab rivers in northern Punjab. It has hot summers and a stronger monsoon than the south of the province, and winter fog is common.",
  "dera-ghazi-khan":
    "Dera Ghazi Khan lies between the Indus and the Sulaiman Range. Summers are extremely hot and rain is low in the city itself, but monsoon storms over the mountains send hill torrents down onto the plains to the west.",
  sheikhupura:
    "Sheikhupura is just north-west of Lahore and has much the same weather: hot summers, a humid monsoon, and winter fog that often mixes with smog from the city.",
  jhang:
    "Jhang sits by the Chenab in central Punjab. It has long, hot summers and little rain, and the river is the thing to watch in a strong monsoon year.",
  murree:
    "Murree is Punjab's best-known hill station, high in the pine forests north-east of Islamabad. Summers are cool, the monsoon is wet and misty, and snow usually falls from December to February. Check the forecast before driving up on a snow weekend, because heavy snowfall can block the roads quickly, as it did in January 2022.",
  karachi:
    "Karachi's weather is set by the Arabian Sea. The sea breeze keeps summer days cooler than inland Sindh, but humidity is high, and heat waves hit hardest when the breeze drops. Rain is rare, yet a single monsoon system can flood the city. Winters are mild and dry.",
  hyderabad:
    "Hyderabad stands on the Indus in lower Sindh and has long been known for its evening breeze, which the city's old rooftop wind catchers were built to use. Summers are very hot, winters are mild, and rain comes mainly in the monsoon.",
  sukkur:
    "Sukkur stands on the Indus in upper Sindh, a region with some of the hottest summers in the country. Rain is low and unreliable, and winters are mild and dry with cool nights.",
  larkana:
    "Larkana is in upper Sindh, close to the ruins of Mohenjo-daro, where 53.5 °C was recorded in May 2010. Summer heat is severe and rain is scarce, but winters are pleasant.",
  nawabshah:
    "Nawabshah, also called Shaheed Benazirabad, lies in the middle of Sindh, far from the cooling sea. It reached 50.2 °C in April 2018, among the highest April temperatures ever reported anywhere.",
  "mirpur-khas":
    "Mirpur Khas lies in lower Sindh on the edge of the Thar Desert, and it's known for its mangoes. Summers are hot, winters are mild, and the monsoon brings nearly all of the year's rain.",
  jacobabad:
    "Jacobabad is regularly one of the hottest cities on Earth. Temperatures have passed 50 °C, and during the monsoon the humidity makes the heat more dangerous still. Winters are mild and make up for a lot.",
  mithi:
    "Mithi is the main town of Tharparkar, in the Thar Desert near the Indian border. Almost all of its rain comes in the monsoon. In a good year the desert turns green, and when the rain fails, drought follows.",
  peshawar:
    "Peshawar lies in a wide valley near the Khyber Pass. Summers are hot, and unlike the south of the country it gets a good share of its rain in winter and spring, from weather systems moving in from the west.",
  abbottabad:
    "Abbottabad lies in the green Orash Valley of Hazara. It stays well below the heat of the plains in summer, which is why people come here to escape it, and it can see light snow in winter.",
  mardan:
    "Mardan is on the plains of the Peshawar Valley. Summers are hot, winters are cool, and rain is split between the monsoon and winter weather systems from the west.",
  swat:
    "These figures are for Mingora, the main town of the Swat Valley. The upper valley around Kalam is much colder. The Swat River can rise fast in the monsoon, and serious floods hit the valley in 2010 and 2022.",
  "dera-ismail-khan":
    "Dera Ismail Khan stands on the west bank of the Indus in the far south of Khyber Pakhtunkhwa. It's one of the province's hottest cities, with dry air, dust in early summer and short winters.",
  kohat:
    "Kohat lies in a valley ringed by low hills in the south of Khyber Pakhtunkhwa. Summers are hot, winters are cool, and it gets rain from both the monsoon and western winter systems.",
  chitral:
    "Chitral is a high valley in the Hindu Kush, below Tirich Mir. Unlike most of Pakistan, it gets most of its rain and snow in winter and spring rather than the monsoon. The Lowari Tunnel keeps the road south open through the snow season.",
  naran:
    "Naran is the main stop in the Kaghan Valley. Cool summers make it busy from June to September. In winter deep snow closes the road and most hotels, usually from about December to April, so check conditions before travelling in spring or late autumn.",
  kalam:
    "Kalam sits at the top of the Swat Valley, where the summer air is cool and the pine forests begin. Winters bring heavy snow that can cut the road, and the monsoon can bring flash floods down the river.",
  mansehra:
    "Mansehra is the gateway to the Kaghan Valley and the Karakoram Highway. It's cooler than the plains in summer, gets plenty of monsoon rain, and has cold winters.",
  "nathia-gali":
    "Nathia Gali is a hill station in the Galiyat, on the forested ridge between Abbottabad and Murree. Summers are cool and very wet in the monsoon, and winter snow can lie for weeks.",
  quetta:
    "Quetta sits in a bowl of mountains at about 1,700 metres. The air is dry, summer nights are cool, and winters are cold, with snow in some years. Most of its rain and snow come in winter and early spring, not in the monsoon.",
  gwadar:
    "Gwadar is on the Makran coast, where the Arabian Sea keeps temperatures steady all year. Summers are humid rather than scorching, and the little rain it gets falls mostly in winter, sometimes in short, flooding bursts.",
  turbat:
    "Turbat lies inland in the Kech Valley of Makran, and it recorded 53.7 °C in May 2017, one of the highest temperatures ever measured in Asia. Rain is scarce, and the winter months are the time to visit.",
  ziarat:
    "Ziarat is a hill town in Balochistan's ancient juniper forest, and home to the Quaid-e-Azam Residency. Summers are cool, which draws visitors from Quetta and the plains, and winters bring snow.",
  khuzdar:
    "Khuzdar lies in a valley in the highlands of central Balochistan. The air is dry, with hot summer days and cold winter nights, and rain is scarce and irregular.",
  sibi:
    "Sibi, on the Kachhi plain, is one of the hottest places in Balochistan, and summers here are fierce. The famous Sibi Mela horse and cattle show is held in February, before the heat returns.",
  dalbandin:
    "Dalbandin is in the Chagai desert in the far north-west of Balochistan, one of the driest parts of Pakistan. Rain is rare, and strong summer winds carry dust and sand across the plains.",
  gilgit:
    "Gilgit lies deep in the Karakoram, where the mountains block most of the monsoon. That makes it surprisingly dry, with hot summer days and cold winters. When storms or glacier melt do strike, flash floods can cut the Karakoram Highway.",
  skardu:
    "Skardu sits in a wide valley on the Indus, the gateway to K2 and the Deosai Plains. Summer days are warm and dry, and winters are long and bitterly cold. Flights here depend on clear weather, so allow a spare day.",
  hunza:
    "These figures are for Karimabad, in central Hunza. Spring blossom arrives around April, and the valley's autumn colours peak around late October and November. Winters are very cold but mostly dry.",
  astore:
    "Astore is a high valley between Gilgit and the Deosai Plains, close to Nanga Parbat. Summers are mild and short. Winter snow is heavy and can block the road up to Rama and beyond.",
  muzaffarabad:
    "Muzaffarabad, the capital of Azad Kashmir, stands where the Neelum and Jhelum rivers meet. It's lower than many people expect, so summers are warm. The monsoon is very wet, and landslides are a risk on the roads around it.",
  mirpur:
    "Mirpur stands on Mangla Lake in the lowest and hottest part of Azad Kashmir. Its climate is closer to the Punjab plains than to the hills further north, with hot summers and a strong monsoon.",
  rawalakot:
    "Rawalakot lies in a high green valley in Poonch, close to Banjosa Lake. Summers are cool, the monsoon is wet, and winters bring snow.",
  "neelum-valley":
    "These figures are for Athmuqam, in the middle of the Neelum Valley. Higher up, around Keran, Sharda and Kel, it's much colder, and heavy snow can cut those villages off in winter. Monsoon landslides often close the valley road.",
};

export const PROVINCE_GUIDES: Record<ProvinceSlug, string> = {
  punjab:
    "Punjab runs from the Himalayan foothills near Murree down to the edge of the Cholistan Desert. The north gets a strong monsoon, the south stays hot and dry, and in winter fog and smog settle over the plains, Lahore most of all.",
  sindh:
    "Sindh has some of the highest temperatures in the world. Upper Sindh around Jacobabad and Sukkur bakes in May and June, while Karachi and the coast stay humid and milder thanks to the Arabian Sea. Rain is scarce and comes almost entirely in the monsoon.",
  "khyber-pakhtunkhwa":
    "Khyber Pakhtunkhwa climbs from the hot plains of Peshawar and Dera Ismail Khan to the snowy valleys of Swat, Kaghan and Chitral. Its hill stations are where much of Pakistan goes to escape the summer heat.",
  balochistan:
    "Balochistan is Pakistan's largest and driest province. Quetta and Ziarat have cold winters with snow, the Kachhi plain around Sibi is among the hottest land in the country, and the Makran coast stays mild beside the Arabian Sea.",
  "gilgit-baltistan":
    "Gilgit-Baltistan holds the great peaks of the Karakoram and western Himalaya, including K2 and Nanga Parbat. The mountains block most of the monsoon, so valley floors are dry, with warm summer days and hard winters. Summer is the main travel season.",
  "azad-kashmir":
    "Azad Kashmir rises from warm, low Mirpur to the high forests of the Neelum Valley. The monsoon is heavy across the region, and the higher valleys get deep winter snow.",
};

/** Pakistan's seasons, as the Pakistan Meteorological Department describes them. */
export const SEASONS = [
  {
    name: "Winter",
    months: "December to February",
    text: "Cold in the north, with snow in the mountains and at hill stations such as Murree. The plains get fog and smog, and the south stays mild and dry.",
  },
  {
    name: "Spring",
    months: "March to May",
    text: "A short, pleasant spring turns quickly into heat. By May, Sindh and southern Punjab can pass 45 °C, and storms and hail build in the north.",
  },
  {
    name: "Summer and monsoon",
    months: "June to September",
    text: "Heat peaks in June, then the monsoon arrives, usually in early July. It brings most of the year's rain to Punjab, Sindh and Azad Kashmir, along with urban and river floods.",
  },
  {
    name: "Autumn",
    months: "October and November",
    text: "Dry, clear and comfortable across much of the country. It's the best time for the northern valleys' colours, and smog begins to build in Punjab.",
  },
];
