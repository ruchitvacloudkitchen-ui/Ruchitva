// Mirrors the seed rows in supabase/schema.sql. Only used if the menu table
// cannot be read, so a fresh deploy never shows an empty menu section.
export interface MenuItem {
  item_te: string;
  item_en: string;
}

export interface MenuDay {
  dayOfWeek: number;
  breakfast: MenuItem[];
  lunch: MenuItem[];
}

export const MENU_FALLBACK: MenuDay[] = [
  {
    dayOfWeek: 1,
    breakfast: [{ item_te: 'రాగి దోశ + అల్లం చట్నీ', item_en: 'Ragi dosa + ginger chutney' }],
    lunch: [{ item_te: 'చిరుధాన్యాల అన్నం + పప్పు + కూర', item_en: 'Millet rice + dal + curry' }],
  },
  {
    dayOfWeek: 2,
    breakfast: [{ item_te: 'కొర్ర ఇడ్లీ + సాంబార్', item_en: 'Foxtail millet idli + sambar' }],
    lunch: [{ item_te: 'కొర్ర పులిహోర + మజ్జిగ', item_en: 'Foxtail lemon rice + buttermilk' }],
  },
  {
    dayOfWeek: 3,
    breakfast: [{ item_te: 'సజ్జ ఉప్మా + కొబ్బరి చట్నీ', item_en: 'Bajra upma + coconut chutney' }],
    lunch: [{ item_te: 'రాగి సంకటి + నాటుకోడి చారు', item_en: 'Ragi sankati + country charu' }],
  },
  {
    dayOfWeek: 4,
    breakfast: [
      { item_te: 'అరికెల పొంగల్ + గోంగూర పచ్చడి', item_en: 'Barnyard pongal + gongura pickle' },
    ],
    lunch: [
      { item_te: 'చిరుధాన్యాల అన్నం + సాంబార్ + వేపుడు', item_en: 'Millet rice + sambar + fry' },
    ],
  },
  {
    dayOfWeek: 5,
    breakfast: [{ item_te: 'జొన్న రొట్టె + వేరుశనగ చట్నీ', item_en: 'Jowar rotte + peanut chutney' }],
    lunch: [{ item_te: 'సజ్జ ఖిచిడీ + పెరుగు', item_en: 'Bajra khichdi + curd' }],
  },
];
