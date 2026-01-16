// Ghana Administrative Divisions Data
// Structure: Region -> Constituency -> District

export interface District {
  name: string;
  capital?: string;
}

export interface Constituency {
  name: string;
  districts: District[];
}

export interface Region {
  name: string;
  capital: string;
  constituencies: Constituency[];
}

export const ghanaRegions: Region[] = [
  {
    name: "Greater Accra",
    capital: "Accra",
    constituencies: [
      {
        name: "Accra Central",
        districts: [
          { name: "Accra Metropolitan", capital: "Accra" },
        ],
      },
      {
        name: "Ablekuma Central",
        districts: [
          { name: "Ablekuma Central Municipal", capital: "Dansoman" },
        ],
      },
      {
        name: "Ablekuma North",
        districts: [
          { name: "Ablekuma North Municipal", capital: "Achimota" },
        ],
      },
      {
        name: "Ablekuma South",
        districts: [
          { name: "Ablekuma South Municipal", capital: "Korle Bu" },
        ],
      },
      {
        name: "Ablekuma West",
        districts: [
          { name: "Ablekuma West Municipal", capital: "Gbawe" },
        ],
      },
      {
        name: "Adentan",
        districts: [
          { name: "Adentan Municipal", capital: "Adentan" },
        ],
      },
      {
        name: "Ashaiman",
        districts: [
          { name: "Ashaiman Municipal", capital: "Ashaiman" },
        ],
      },
      {
        name: "Ayawaso Central",
        districts: [
          { name: "Ayawaso Central Municipal", capital: "Kokomlemle" },
        ],
      },
      {
        name: "Ayawaso East",
        districts: [
          { name: "Ayawaso East Municipal", capital: "Nima" },
        ],
      },
      {
        name: "Ayawaso North",
        districts: [
          { name: "Ayawaso North Municipal", capital: "Kanda" },
        ],
      },
      {
        name: "Ayawaso West",
        districts: [
          { name: "Ayawaso West Municipal", capital: "Abelemkpe" },
        ],
      },
      {
        name: "Bortianor-Ngleshie Amanfro",
        districts: [
          { name: "Ga South Municipal", capital: "Weija" },
        ],
      },
      {
        name: "Dade Kotopon",
        districts: [
          { name: "La Dade Kotopon Municipal", capital: "La" },
        ],
      },
      {
        name: "Dome-Kwabenya",
        districts: [
          { name: "Ga East Municipal", capital: "Abokobi" },
        ],
      },
      {
        name: "Klottey Korle",
        districts: [
          { name: "Klottey Korle Municipal", capital: "Osu" },
        ],
      },
      {
        name: "Korle Klottey",
        districts: [
          { name: "Korle Klottey Municipal", capital: "Osu" },
        ],
      },
      {
        name: "Kpone Katamanso",
        districts: [
          { name: "Kpone Katamanso Municipal", capital: "Kpone" },
        ],
      },
      {
        name: "Krowor",
        districts: [
          { name: "Krowor Municipal", capital: "Nungua" },
        ],
      },
      {
        name: "La Dadekotopon",
        districts: [
          { name: "La Dade Kotopon Municipal", capital: "La" },
        ],
      },
      {
        name: "La Nkwantanang Madina",
        districts: [
          { name: "La Nkwantanang Madina Municipal", capital: "Madina" },
        ],
      },
      {
        name: "Ledzokuku",
        districts: [
          { name: "Ledzokuku Municipal", capital: "Teshie" },
        ],
      },
      {
        name: "Ningo Prampram",
        districts: [
          { name: "Ningo Prampram District", capital: "Prampram" },
        ],
      },
      {
        name: "Okaikwei Central",
        districts: [
          { name: "Okaikwei Central Municipal", capital: "Bubuashie" },
        ],
      },
      {
        name: "Okaikwei North",
        districts: [
          { name: "Okaikwei North Municipal", capital: "Tesano" },
        ],
      },
      {
        name: "Shai Osudoku",
        districts: [
          { name: "Shai Osudoku District", capital: "Dodowa" },
        ],
      },
      {
        name: "Tema Central",
        districts: [
          { name: "Tema Metropolitan", capital: "Tema" },
        ],
      },
      {
        name: "Tema East",
        districts: [
          { name: "Tema Metropolitan", capital: "Tema" },
        ],
      },
      {
        name: "Tema West",
        districts: [
          { name: "Tema West Municipal", capital: "Tema" },
        ],
      },
      {
        name: "Trobu",
        districts: [
          { name: "Ga North Municipal", capital: "Ofankor" },
        ],
      },
      {
        name: "Weija Gbawe",
        districts: [
          { name: "Weija Gbawe Municipal", capital: "Weija" },
        ],
      },
    ],
  },
  {
    name: "Ashanti",
    capital: "Kumasi",
    constituencies: [
      {
        name: "Kumasi Central",
        districts: [
          { name: "Kumasi Metropolitan", capital: "Kumasi" },
        ],
      },
      {
        name: "Asawase",
        districts: [
          { name: "Asokore Mampong Municipal", capital: "Asokore Mampong" },
        ],
      },
      {
        name: "Bantama",
        districts: [
          { name: "Kumasi Metropolitan", capital: "Kumasi" },
        ],
      },
      {
        name: "Nhyiaeso",
        districts: [
          { name: "Kumasi Metropolitan", capital: "Kumasi" },
        ],
      },
      {
        name: "Subin",
        districts: [
          { name: "Kumasi Metropolitan", capital: "Kumasi" },
        ],
      },
      {
        name: "Kwadaso",
        districts: [
          { name: "Kwadaso Municipal", capital: "Kwadaso" },
        ],
      },
      {
        name: "Old Tafo",
        districts: [
          { name: "Old Tafo Municipal", capital: "Old Tafo" },
        ],
      },
      {
        name: "Suame",
        districts: [
          { name: "Suame Municipal", capital: "Suame" },
        ],
      },
      {
        name: "Manhyia North",
        districts: [
          { name: "Kumasi Metropolitan", capital: "Kumasi" },
        ],
      },
      {
        name: "Manhyia South",
        districts: [
          { name: "Kumasi Metropolitan", capital: "Kumasi" },
        ],
      },
      {
        name: "Oforikrom",
        districts: [
          { name: "Oforikrom Municipal", capital: "Oforikrom" },
        ],
      },
      {
        name: "Asokwa",
        districts: [
          { name: "Asokwa Municipal", capital: "Asokwa" },
        ],
      },
      {
        name: "Ejisu",
        districts: [
          { name: "Ejisu Municipal", capital: "Ejisu" },
        ],
      },
      {
        name: "Juaben",
        districts: [
          { name: "Ejisu Municipal", capital: "Ejisu" },
        ],
      },
      {
        name: "Bekwai",
        districts: [
          { name: "Bekwai Municipal", capital: "Bekwai" },
        ],
      },
      {
        name: "Bosome Freho",
        districts: [
          { name: "Bosome Freho District", capital: "Asiwa" },
        ],
      },
      {
        name: "Obuasi East",
        districts: [
          { name: "Obuasi Municipal", capital: "Obuasi" },
        ],
      },
      {
        name: "Obuasi West",
        districts: [
          { name: "Obuasi Municipal", capital: "Obuasi" },
        ],
      },
      {
        name: "Adansi Asokwa",
        districts: [
          { name: "Adansi South District", capital: "New Edubiase" },
        ],
      },
      {
        name: "Adansi North",
        districts: [
          { name: "Adansi North District", capital: "Fomena" },
        ],
      },
      {
        name: "Afigya Kwabre North",
        districts: [
          { name: "Afigya Kwabre North District", capital: "Afrancho" },
        ],
      },
      {
        name: "Afigya Kwabre South",
        districts: [
          { name: "Afigya Kwabre South District", capital: "Kodie" },
        ],
      },
      {
        name: "Ahafo Ano North",
        districts: [
          { name: "Ahafo Ano North Municipal", capital: "Tepa" },
        ],
      },
      {
        name: "Ahafo Ano South East",
        districts: [
          { name: "Ahafo Ano South East District", capital: "Mankranso" },
        ],
      },
      {
        name: "Ahafo Ano South West",
        districts: [
          { name: "Ahafo Ano South West District", capital: "Sabronum" },
        ],
      },
      {
        name: "Akrofuom",
        districts: [
          { name: "Akrofuom District", capital: "Akrofuom" },
        ],
      },
      {
        name: "Amansie Central",
        districts: [
          { name: "Amansie Central District", capital: "Jacobu" },
        ],
      },
      {
        name: "Amansie South",
        districts: [
          { name: "Amansie South District", capital: "Manso Nkwanta" },
        ],
      },
      {
        name: "Amansie West",
        districts: [
          { name: "Amansie West District", capital: "Manso Nkwanta" },
        ],
      },
      {
        name: "Asante Akim Central",
        districts: [
          { name: "Asante Akim Central Municipal", capital: "Konongo" },
        ],
      },
      {
        name: "Asante Akim North",
        districts: [
          { name: "Asante Akim North District", capital: "Agogo" },
        ],
      },
      {
        name: "Asante Akim South",
        districts: [
          { name: "Asante Akim South Municipal", capital: "Juaso" },
        ],
      },
      {
        name: "Atwima Kwanwoma",
        districts: [
          { name: "Atwima Kwanwoma District", capital: "Foase" },
        ],
      },
      {
        name: "Atwima Mponua",
        districts: [
          { name: "Atwima Mponua District", capital: "Nyinahin" },
        ],
      },
      {
        name: "Atwima Nwabiagya North",
        districts: [
          { name: "Atwima Nwabiagya North District", capital: "Barekese" },
        ],
      },
      {
        name: "Atwima Nwabiagya South",
        districts: [
          { name: "Atwima Nwabiagya Municipal", capital: "Nkawie" },
        ],
      },
      {
        name: "Bosomtwe",
        districts: [
          { name: "Bosomtwe District", capital: "Kuntanase" },
        ],
      },
      {
        name: "Effiduase Asokore",
        districts: [
          { name: "Sekyere East District", capital: "Effiduase" },
        ],
      },
      {
        name: "Ejura Sekyedumase",
        districts: [
          { name: "Ejura Sekyedumase Municipal", capital: "Ejura" },
        ],
      },
      {
        name: "Kwabre East",
        districts: [
          { name: "Kwabre East Municipal", capital: "Mamponteng" },
        ],
      },
      {
        name: "Mampong",
        districts: [
          { name: "Mampong Municipal", capital: "Mampong" },
        ],
      },
      {
        name: "Nsuta Kwamang Beposo",
        districts: [
          { name: "Sekyere Central District", capital: "Nsuta" },
        ],
      },
      {
        name: "Offinso North",
        districts: [
          { name: "Offinso North District", capital: "Akomadan" },
        ],
      },
      {
        name: "Offinso South",
        districts: [
          { name: "Offinso Municipal", capital: "Offinso" },
        ],
      },
      {
        name: "Sekyere Afram Plains",
        districts: [
          { name: "Sekyere Afram Plains District", capital: "Drobonso" },
        ],
      },
      {
        name: "Sekyere Kumawu",
        districts: [
          { name: "Sekyere Kumawu District", capital: "Kumawu" },
        ],
      },
    ],
  },
  {
    name: "Western",
    capital: "Sekondi-Takoradi",
    constituencies: [
      {
        name: "Sekondi",
        districts: [
          { name: "Sekondi Takoradi Metropolitan", capital: "Sekondi" },
        ],
      },
      {
        name: "Takoradi",
        districts: [
          { name: "Sekondi Takoradi Metropolitan", capital: "Takoradi" },
        ],
      },
      {
        name: "Essikado Ketan",
        districts: [
          { name: "Sekondi Takoradi Metropolitan", capital: "Essikado" },
        ],
      },
      {
        name: "Effia",
        districts: [
          { name: "Effia Kwesimintsim Municipal", capital: "Effia" },
        ],
      },
      {
        name: "Kwesimintsim",
        districts: [
          { name: "Effia Kwesimintsim Municipal", capital: "Kwesimintsim" },
        ],
      },
      {
        name: "Ahanta West",
        districts: [
          { name: "Ahanta West Municipal", capital: "Agona Nkwanta" },
        ],
      },
      {
        name: "Shama",
        districts: [
          { name: "Shama District", capital: "Shama" },
        ],
      },
      {
        name: "Mpohor",
        districts: [
          { name: "Mpohor District", capital: "Mpohor" },
        ],
      },
      {
        name: "Tarkwa Nsuaem",
        districts: [
          { name: "Tarkwa Nsuaem Municipal", capital: "Tarkwa" },
        ],
      },
      {
        name: "Prestea Huni Valley",
        districts: [
          { name: "Prestea Huni Valley Municipal", capital: "Bogoso" },
        ],
      },
      {
        name: "Wassa East",
        districts: [
          { name: "Wassa East District", capital: "Daboase" },
        ],
      },
      {
        name: "Amenfi Central",
        districts: [
          { name: "Amenfi Central District", capital: "Wassa Akropong" },
        ],
      },
      {
        name: "Amenfi East",
        districts: [
          { name: "Amenfi East Municipal", capital: "Wassa Akropong" },
        ],
      },
      {
        name: "Amenfi West",
        districts: [
          { name: "Amenfi West Municipal", capital: "Asankragwa" },
        ],
      },
    ],
  },
  {
    name: "Central",
    capital: "Cape Coast",
    constituencies: [
      {
        name: "Cape Coast North",
        districts: [
          { name: "Cape Coast Metropolitan", capital: "Cape Coast" },
        ],
      },
      {
        name: "Cape Coast South",
        districts: [
          { name: "Cape Coast Metropolitan", capital: "Cape Coast" },
        ],
      },
      {
        name: "Abura Asebu Kwamankese",
        districts: [
          { name: "Abura Asebu Kwamankese District", capital: "Abura Dunkwa" },
        ],
      },
      {
        name: "Mfantseman",
        districts: [
          { name: "Mfantseman Municipal", capital: "Saltpond" },
        ],
      },
      {
        name: "Ekumfi",
        districts: [
          { name: "Ekumfi District", capital: "Essarkyir" },
        ],
      },
      {
        name: "Ajumako Enyan Essiam",
        districts: [
          { name: "Ajumako Enyan Essiam District", capital: "Ajumako" },
        ],
      },
      {
        name: "Gomoa Central",
        districts: [
          { name: "Gomoa Central District", capital: "Afransi" },
        ],
      },
      {
        name: "Gomoa East",
        districts: [
          { name: "Gomoa East District", capital: "Potsin" },
        ],
      },
      {
        name: "Gomoa West",
        districts: [
          { name: "Gomoa West District", capital: "Apam" },
        ],
      },
      {
        name: "Effutu",
        districts: [
          { name: "Effutu Municipal", capital: "Winneba" },
        ],
      },
      {
        name: "Awutu Senya East",
        districts: [
          { name: "Awutu Senya East Municipal", capital: "Kasoa" },
        ],
      },
      {
        name: "Awutu Senya West",
        districts: [
          { name: "Awutu Senya West District", capital: "Awutu Beraku" },
        ],
      },
      {
        name: "Agona East",
        districts: [
          { name: "Agona East District", capital: "Nsaba" },
        ],
      },
      {
        name: "Agona West",
        districts: [
          { name: "Agona West Municipal", capital: "Swedru" },
        ],
      },
      {
        name: "Asikuma Odoben Brakwa",
        districts: [
          { name: "Asikuma Odoben Brakwa District", capital: "Breman Asikuma" },
        ],
      },
      {
        name: "Assin Central",
        districts: [
          { name: "Assin Central Municipal", capital: "Assin Fosu" },
        ],
      },
      {
        name: "Assin North",
        districts: [
          { name: "Assin North District", capital: "Assin Bereku" },
        ],
      },
      {
        name: "Assin South",
        districts: [
          { name: "Assin South District", capital: "Nsuaem Kyekyewere" },
        ],
      },
      {
        name: "Twifo Atti Morkwa",
        districts: [
          { name: "Twifo Atti Morkwa District", capital: "Twifo Praso" },
        ],
      },
      {
        name: "Hemang Lower Denkyira",
        districts: [
          { name: "Twifo Hemang Lower Denkyira District", capital: "Hemang" },
        ],
      },
      {
        name: "Upper Denkyira East",
        districts: [
          { name: "Upper Denkyira East Municipal", capital: "Dunkwa-on-Offin" },
        ],
      },
      {
        name: "Upper Denkyira West",
        districts: [
          { name: "Upper Denkyira West District", capital: "Diaso" },
        ],
      },
      {
        name: "Komenda Edina Eguafo Abirem",
        districts: [
          { name: "Komenda Edina Eguafo Abirem Municipal", capital: "Elmina" },
        ],
      },
    ],
  },
  {
    name: "Eastern",
    capital: "Koforidua",
    constituencies: [
      {
        name: "New Juaben North",
        districts: [
          { name: "New Juaben North Municipal", capital: "Effiduase" },
        ],
      },
      {
        name: "New Juaben South",
        districts: [
          { name: "New Juaben South Municipal", capital: "Koforidua" },
        ],
      },
      {
        name: "Akuapem North",
        districts: [
          { name: "Akuapem North Municipal", capital: "Akropong" },
        ],
      },
      {
        name: "Akuapem South",
        districts: [
          { name: "Akuapem South District", capital: "Aburi" },
        ],
      },
      {
        name: "Nsawam Adoagyiri",
        districts: [
          { name: "Nsawam Adoagyiri Municipal", capital: "Nsawam" },
        ],
      },
      {
        name: "Suhum",
        districts: [
          { name: "Suhum Municipal", capital: "Suhum" },
        ],
      },
      {
        name: "Ayensuano",
        districts: [
          { name: "Ayensuano District", capital: "Coaltar" },
        ],
      },
      {
        name: "Akim Oda",
        districts: [
          { name: "Birim Central Municipal", capital: "Akim Oda" },
        ],
      },
      {
        name: "Akim Swedru",
        districts: [
          { name: "Birim South District", capital: "Akim Swedru" },
        ],
      },
      {
        name: "Achiase",
        districts: [
          { name: "Achiase District", capital: "Achiase" },
        ],
      },
      {
        name: "Ofoase Ayirebi",
        districts: [
          { name: "Birim North District", capital: "New Abirem" },
        ],
      },
      {
        name: "Atiwa East",
        districts: [
          { name: "Atiwa East District", capital: "Anyinam" },
        ],
      },
      {
        name: "Atiwa West",
        districts: [
          { name: "Atiwa West District", capital: "Kwabeng" },
        ],
      },
      {
        name: "Abuakwa North",
        districts: [
          { name: "Abuakwa North Municipal", capital: "Kukurantumi" },
        ],
      },
      {
        name: "Abuakwa South",
        districts: [
          { name: "Abuakwa South Municipal", capital: "Kibi" },
        ],
      },
      {
        name: "Fanteakwa North",
        districts: [
          { name: "Fanteakwa North District", capital: "Begoro" },
        ],
      },
      {
        name: "Fanteakwa South",
        districts: [
          { name: "Fanteakwa South District", capital: "Osino" },
        ],
      },
      {
        name: "Yilo Krobo",
        districts: [
          { name: "Yilo Krobo Municipal", capital: "Somanya" },
        ],
      },
      {
        name: "Lower Manya Krobo",
        districts: [
          { name: "Lower Manya Krobo Municipal", capital: "Odumase Krobo" },
        ],
      },
      {
        name: "Upper Manya Krobo",
        districts: [
          { name: "Upper Manya Krobo District", capital: "Asesewa" },
        ],
      },
      {
        name: "Asuogyaman",
        districts: [
          { name: "Asuogyaman District", capital: "Atimpoku" },
        ],
      },
      {
        name: "Afram Plains North",
        districts: [
          { name: "Afram Plains North District", capital: "Donkorkrom" },
        ],
      },
      {
        name: "Afram Plains South",
        districts: [
          { name: "Afram Plains South District", capital: "Tease" },
        ],
      },
      {
        name: "Kwahu Afram Plains North",
        districts: [
          { name: "Kwahu Afram Plains North District", capital: "Donkorkrom" },
        ],
      },
      {
        name: "Kwahu East",
        districts: [
          { name: "Kwahu East District", capital: "Abetifi" },
        ],
      },
      {
        name: "Kwahu South",
        districts: [
          { name: "Kwahu South District", capital: "Mpraeso" },
        ],
      },
      {
        name: "Kwahu West",
        districts: [
          { name: "Kwahu West Municipal", capital: "Nkawkaw" },
        ],
      },
      {
        name: "Nkawkaw",
        districts: [
          { name: "Kwahu West Municipal", capital: "Nkawkaw" },
        ],
      },
      {
        name: "Mpraeso",
        districts: [
          { name: "Kwahu South District", capital: "Mpraeso" },
        ],
      },
      {
        name: "Abetifi",
        districts: [
          { name: "Kwahu East District", capital: "Abetifi" },
        ],
      },
      {
        name: "Denkyembour",
        districts: [
          { name: "Denkyembour District", capital: "Akwatia" },
        ],
      },
      {
        name: "West Akim",
        districts: [
          { name: "West Akim Municipal", capital: "Asamankese" },
        ],
      },
    ],
  },
  {
    name: "Volta",
    capital: "Ho",
    constituencies: [
      {
        name: "Ho Central",
        districts: [
          { name: "Ho Municipal", capital: "Ho" },
        ],
      },
      {
        name: "Ho West",
        districts: [
          { name: "Ho West District", capital: "Dzolokpuita" },
        ],
      },
      {
        name: "Adaklu",
        districts: [
          { name: "Adaklu District", capital: "Adaklu Waya" },
        ],
      },
      {
        name: "Akatsi North",
        districts: [
          { name: "Akatsi North District", capital: "Ave Dakpa" },
        ],
      },
      {
        name: "Akatsi South",
        districts: [
          { name: "Akatsi South District", capital: "Akatsi" },
        ],
      },
      {
        name: "Anlo",
        districts: [
          { name: "Anlo District", capital: "Anloga" },
        ],
      },
      {
        name: "Keta",
        districts: [
          { name: "Keta Municipal", capital: "Keta" },
        ],
      },
      {
        name: "Ketu North",
        districts: [
          { name: "Ketu North Municipal", capital: "Dzodze" },
        ],
      },
      {
        name: "Ketu South",
        districts: [
          { name: "Ketu South Municipal", capital: "Aflao" },
        ],
      },
      {
        name: "Agotime Ziope",
        districts: [
          { name: "Agotime Ziope District", capital: "Kpetoe" },
        ],
      },
      {
        name: "North Tongu",
        districts: [
          { name: "North Tongu District", capital: "Battor" },
        ],
      },
      {
        name: "South Tongu",
        districts: [
          { name: "South Tongu District", capital: "Sogakope" },
        ],
      },
      {
        name: "Central Tongu",
        districts: [
          { name: "Central Tongu District", capital: "Adidome" },
        ],
      },
      {
        name: "North Dayi",
        districts: [
          { name: "North Dayi District", capital: "Anfoega" },
        ],
      },
      {
        name: "South Dayi",
        districts: [
          { name: "South Dayi District", capital: "Kpeve" },
        ],
      },
      {
        name: "Afadjato South",
        districts: [
          { name: "Afadjato South District", capital: "Ve Golokwati" },
        ],
      },
    ],
  },
  {
    name: "Northern",
    capital: "Tamale",
    constituencies: [
      {
        name: "Tamale Central",
        districts: [
          { name: "Tamale Metropolitan", capital: "Tamale" },
        ],
      },
      {
        name: "Tamale North",
        districts: [
          { name: "Tamale Metropolitan", capital: "Tamale" },
        ],
      },
      {
        name: "Tamale South",
        districts: [
          { name: "Tamale Metropolitan", capital: "Tamale" },
        ],
      },
      {
        name: "Sagnarigu",
        districts: [
          { name: "Sagnarigu Municipal", capital: "Sagnarigu" },
        ],
      },
      {
        name: "Tolon",
        districts: [
          { name: "Tolon District", capital: "Tolon" },
        ],
      },
      {
        name: "Kumbungu",
        districts: [
          { name: "Kumbungu District", capital: "Kumbungu" },
        ],
      },
      {
        name: "Savelugu",
        districts: [
          { name: "Savelugu Municipal", capital: "Savelugu" },
        ],
      },
      {
        name: "Nanton",
        districts: [
          { name: "Nanton District", capital: "Nanton" },
        ],
      },
      {
        name: "Mion",
        districts: [
          { name: "Mion District", capital: "Sang" },
        ],
      },
      {
        name: "Yendi",
        districts: [
          { name: "Yendi Municipal", capital: "Yendi" },
        ],
      },
      {
        name: "Gushegu",
        districts: [
          { name: "Gushegu Municipal", capital: "Gushegu" },
        ],
      },
      {
        name: "Karaga",
        districts: [
          { name: "Karaga District", capital: "Karaga" },
        ],
      },
      {
        name: "Zabzugu",
        districts: [
          { name: "Zabzugu District", capital: "Zabzugu" },
        ],
      },
      {
        name: "Tatale Sanguli",
        districts: [
          { name: "Tatale Sanguli District", capital: "Tatale" },
        ],
      },
      {
        name: "Saboba",
        districts: [
          { name: "Saboba District", capital: "Saboba" },
        ],
      },
      {
        name: "Chereponi",
        districts: [
          { name: "Chereponi District", capital: "Chereponi" },
        ],
      },
      {
        name: "Nanumba North",
        districts: [
          { name: "Nanumba North Municipal", capital: "Bimbilla" },
        ],
      },
      {
        name: "Nanumba South",
        districts: [
          { name: "Nanumba South District", capital: "Wulensi" },
        ],
      },
    ],
  },
  {
    name: "Upper East",
    capital: "Bolgatanga",
    constituencies: [
      {
        name: "Bolgatanga Central",
        districts: [
          { name: "Bolgatanga Municipal", capital: "Bolgatanga" },
        ],
      },
      {
        name: "Bolgatanga East",
        districts: [
          { name: "Bolgatanga East District", capital: "Zuarungu" },
        ],
      },
      {
        name: "Bongo",
        districts: [
          { name: "Bongo District", capital: "Bongo" },
        ],
      },
      {
        name: "Talensi",
        districts: [
          { name: "Talensi District", capital: "Tongo" },
        ],
      },
      {
        name: "Nabdam",
        districts: [
          { name: "Nabdam District", capital: "Nangodi" },
        ],
      },
      {
        name: "Bawku Central",
        districts: [
          { name: "Bawku Municipal", capital: "Bawku" },
        ],
      },
      {
        name: "Bawku West",
        districts: [
          { name: "Bawku West District", capital: "Zebilla" },
        ],
      },
      {
        name: "Binduri",
        districts: [
          { name: "Binduri District", capital: "Binduri" },
        ],
      },
      {
        name: "Pusiga",
        districts: [
          { name: "Pusiga District", capital: "Pusiga" },
        ],
      },
      {
        name: "Garu",
        districts: [
          { name: "Garu District", capital: "Garu" },
        ],
      },
      {
        name: "Tempane",
        districts: [
          { name: "Tempane District", capital: "Tempane" },
        ],
      },
      {
        name: "Builsa North",
        districts: [
          { name: "Builsa North Municipal", capital: "Sandema" },
        ],
      },
      {
        name: "Builsa South",
        districts: [
          { name: "Builsa South District", capital: "Fumbisi" },
        ],
      },
      {
        name: "Kassena Nankana West",
        districts: [
          { name: "Kassena Nankana West District", capital: "Paga" },
        ],
      },
      {
        name: "Navrongo Central",
        districts: [
          { name: "Kassena Nankana Municipal", capital: "Navrongo" },
        ],
      },
    ],
  },
  {
    name: "Upper West",
    capital: "Wa",
    constituencies: [
      {
        name: "Wa Central",
        districts: [
          { name: "Wa Municipal", capital: "Wa" },
        ],
      },
      {
        name: "Wa East",
        districts: [
          { name: "Wa East District", capital: "Funsi" },
        ],
      },
      {
        name: "Wa West",
        districts: [
          { name: "Wa West District", capital: "Wechiau" },
        ],
      },
      {
        name: "Nadowli Kaleo",
        districts: [
          { name: "Nadowli Kaleo District", capital: "Nadowli" },
        ],
      },
      {
        name: "Daffiama Bussie Issa",
        districts: [
          { name: "Daffiama Bussie Issa District", capital: "Daffiama" },
        ],
      },
      {
        name: "Jirapa",
        districts: [
          { name: "Jirapa Municipal", capital: "Jirapa" },
        ],
      },
      {
        name: "Lambussie Karni",
        districts: [
          { name: "Lambussie Karni District", capital: "Lambussie" },
        ],
      },
      {
        name: "Lawra",
        districts: [
          { name: "Lawra Municipal", capital: "Lawra" },
        ],
      },
      {
        name: "Nandom",
        districts: [
          { name: "Nandom Municipal", capital: "Nandom" },
        ],
      },
      {
        name: "Sissala East",
        districts: [
          { name: "Sissala East Municipal", capital: "Tumu" },
        ],
      },
      {
        name: "Sissala West",
        districts: [
          { name: "Sissala West District", capital: "Gwollu" },
        ],
      },
    ],
  },
  {
    name: "Bono",
    capital: "Sunyani",
    constituencies: [
      {
        name: "Sunyani East",
        districts: [
          { name: "Sunyani Municipal", capital: "Sunyani" },
        ],
      },
      {
        name: "Sunyani West",
        districts: [
          { name: "Sunyani West Municipal", capital: "Odumase" },
        ],
      },
      {
        name: "Berekum East",
        districts: [
          { name: "Berekum Municipal", capital: "Berekum" },
        ],
      },
      {
        name: "Berekum West",
        districts: [
          { name: "Berekum West District", capital: "Jinijini" },
        ],
      },
      {
        name: "Dormaa Central",
        districts: [
          { name: "Dormaa Municipal", capital: "Dormaa Ahenkro" },
        ],
      },
      {
        name: "Dormaa East",
        districts: [
          { name: "Dormaa East District", capital: "Wamfie" },
        ],
      },
      {
        name: "Dormaa West",
        districts: [
          { name: "Dormaa West District", capital: "Nkrankwanta" },
        ],
      },
      {
        name: "Jaman North",
        districts: [
          { name: "Jaman North District", capital: "Sampa" },
        ],
      },
      {
        name: "Jaman South",
        districts: [
          { name: "Jaman South Municipal", capital: "Drobo" },
        ],
      },
      {
        name: "Tain",
        districts: [
          { name: "Tain District", capital: "Nsawkaw" },
        ],
      },
      {
        name: "Wenchi",
        districts: [
          { name: "Wenchi Municipal", capital: "Wenchi" },
        ],
      },
      {
        name: "Banda",
        districts: [
          { name: "Banda District", capital: "Banda Ahenkro" },
        ],
      },
    ],
  },
  {
    name: "Bono East",
    capital: "Techiman",
    constituencies: [
      {
        name: "Techiman North",
        districts: [
          { name: "Techiman North District", capital: "Tuobodom" },
        ],
      },
      {
        name: "Techiman South",
        districts: [
          { name: "Techiman Municipal", capital: "Techiman" },
        ],
      },
      {
        name: "Nkoranza North",
        districts: [
          { name: "Nkoranza North District", capital: "Busunya" },
        ],
      },
      {
        name: "Nkoranza South",
        districts: [
          { name: "Nkoranza South Municipal", capital: "Nkoranza" },
        ],
      },
      {
        name: "Atebubu Amantin",
        districts: [
          { name: "Atebubu Amantin Municipal", capital: "Atebubu" },
        ],
      },
      {
        name: "Sene East",
        districts: [
          { name: "Sene East District", capital: "Kajaji" },
        ],
      },
      {
        name: "Sene West",
        districts: [
          { name: "Sene West District", capital: "Kwame Danso" },
        ],
      },
      {
        name: "Pru East",
        districts: [
          { name: "Pru East District", capital: "Yeji" },
        ],
      },
      {
        name: "Pru West",
        districts: [
          { name: "Pru West District", capital: "Prang" },
        ],
      },
      {
        name: "Kintampo North",
        districts: [
          { name: "Kintampo North Municipal", capital: "Kintampo" },
        ],
      },
      {
        name: "Kintampo South",
        districts: [
          { name: "Kintampo South District", capital: "Jema" },
        ],
      },
    ],
  },
  {
    name: "Ahafo",
    capital: "Goaso",
    constituencies: [
      {
        name: "Asunafo North",
        districts: [
          { name: "Asunafo North Municipal", capital: "Goaso" },
        ],
      },
      {
        name: "Asunafo South",
        districts: [
          { name: "Asunafo South District", capital: "Kukuom" },
        ],
      },
      {
        name: "Asutifi North",
        districts: [
          { name: "Asutifi North District", capital: "Kenyasi" },
        ],
      },
      {
        name: "Asutifi South",
        districts: [
          { name: "Asutifi South District", capital: "Hwidiem" },
        ],
      },
      {
        name: "Tano North",
        districts: [
          { name: "Tano North Municipal", capital: "Duayaw Nkwanta" },
        ],
      },
      {
        name: "Tano South",
        districts: [
          { name: "Tano South Municipal", capital: "Bechem" },
        ],
      },
    ],
  },
  {
    name: "Western North",
    capital: "Sefwi Wiawso",
    constituencies: [
      {
        name: "Sefwi Wiawso",
        districts: [
          { name: "Sefwi Wiawso Municipal", capital: "Sefwi Wiawso" },
        ],
      },
      {
        name: "Sefwi Akontombra",
        districts: [
          { name: "Sefwi Akontombra District", capital: "Sefwi Akontombra" },
        ],
      },
      {
        name: "Bibiani Anhwiaso Bekwai",
        districts: [
          { name: "Bibiani Anhwiaso Bekwai Municipal", capital: "Bibiani" },
        ],
      },
      {
        name: "Suaman",
        districts: [
          { name: "Suaman District", capital: "Dadieso" },
        ],
      },
      {
        name: "Bodi",
        districts: [
          { name: "Bodi District", capital: "Bodi" },
        ],
      },
      {
        name: "Juaboso",
        districts: [
          { name: "Juaboso District", capital: "Juaboso" },
        ],
      },
      {
        name: "Bia East",
        districts: [
          { name: "Bia East District", capital: "Adabokrom" },
        ],
      },
      {
        name: "Bia West",
        districts: [
          { name: "Bia West District", capital: "Essam Debiso" },
        ],
      },
      {
        name: "Aowin",
        districts: [
          { name: "Aowin Municipal", capital: "Enchi" },
        ],
      },
    ],
  },
  {
    name: "Oti",
    capital: "Dambai",
    constituencies: [
      {
        name: "Buem",
        districts: [
          { name: "Jasikan District", capital: "Jasikan" },
        ],
      },
      {
        name: "Akan",
        districts: [
          { name: "Biakoye District", capital: "Nkonya Ahenkro" },
        ],
      },
      {
        name: "Krachi East",
        districts: [
          { name: "Krachi East Municipal", capital: "Dambai" },
        ],
      },
      {
        name: "Krachi West",
        districts: [
          { name: "Krachi West District", capital: "Kete Krachi" },
        ],
      },
      {
        name: "Krachi Nchumuru",
        districts: [
          { name: "Krachi Nchumuru District", capital: "Chinderi" },
        ],
      },
      {
        name: "Nkwanta North",
        districts: [
          { name: "Nkwanta North District", capital: "Kpassa" },
        ],
      },
      {
        name: "Nkwanta South",
        districts: [
          { name: "Nkwanta South Municipal", capital: "Nkwanta" },
        ],
      },
      {
        name: "Guan",
        districts: [
          { name: "Guan District", capital: "Likpe Mate" },
        ],
      },
    ],
  },
  {
    name: "Savannah",
    capital: "Damongo",
    constituencies: [
      {
        name: "Damongo",
        districts: [
          { name: "West Gonja Municipal", capital: "Damongo" },
        ],
      },
      {
        name: "Daboya Mankarigu",
        districts: [
          { name: "North Gonja District", capital: "Daboya" },
        ],
      },
      {
        name: "Yapei Kusawgu",
        districts: [
          { name: "Central Gonja District", capital: "Buipe" },
        ],
      },
      {
        name: "Salaga North",
        districts: [
          { name: "East Gonja Municipal", capital: "Salaga" },
        ],
      },
      {
        name: "Salaga South",
        districts: [
          { name: "East Gonja Municipal", capital: "Salaga" },
        ],
      },
      {
        name: "Bole Bamboi",
        districts: [
          { name: "Bole District", capital: "Bole" },
        ],
      },
      {
        name: "Sawla Tuna Kalba",
        districts: [
          { name: "Sawla Tuna Kalba District", capital: "Sawla" },
        ],
      },
    ],
  },
  {
    name: "North East",
    capital: "Nalerigu",
    constituencies: [
      {
        name: "Nalerigu Gambaga",
        districts: [
          { name: "East Mamprusi Municipal", capital: "Gambaga" },
        ],
      },
      {
        name: "Yunyoo Nasuan",
        districts: [
          { name: "Yunyoo Nasuan District", capital: "Yunyoo" },
        ],
      },
      {
        name: "Bunkpurugu",
        districts: [
          { name: "Bunkpurugu Nakpanduri District", capital: "Bunkpurugu" },
        ],
      },
      {
        name: "Walewale",
        districts: [
          { name: "West Mamprusi Municipal", capital: "Walewale" },
        ],
      },
      {
        name: "Mamprugu Moagduri",
        districts: [
          { name: "Mamprugu Moagduri District", capital: "Yagaba" },
        ],
      },
      {
        name: "Chereponi",
        districts: [
          { name: "Chereponi District", capital: "Chereponi" },
        ],
      },
    ],
  },
];

// Helper functions
export function getRegions(): string[] {
  return ghanaRegions.map((r) => r.name);
}

export function getConstituencies(regionName: string): string[] {
  const region = ghanaRegions.find((r) => r.name === regionName);
  if (!region) return [];
  return region.constituencies.map((c) => c.name);
}

export function getDistricts(regionName: string, constituencyName: string): string[] {
  const region = ghanaRegions.find((r) => r.name === regionName);
  if (!region) return [];
  const constituency = region.constituencies.find((c) => c.name === constituencyName);
  if (!constituency) return [];
  return constituency.districts.map((d) => d.name);
}

export function getRegionByName(name: string): Region | undefined {
  return ghanaRegions.find((r) => r.name === name);
}

export function getConstituencyByName(regionName: string, constituencyName: string): Constituency | undefined {
  const region = ghanaRegions.find((r) => r.name === regionName);
  if (!region) return undefined;
  return region.constituencies.find((c) => c.name === constituencyName);
}
