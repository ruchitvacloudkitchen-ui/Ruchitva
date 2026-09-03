import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'te' | 'en';

const STORAGE_KEY = 'ruchitva_lang';

type Entry = { te: string; en: string };

/** Customer-facing copy. Owner screens are English only, by design. */
const COPY = {
  brand: { te: 'రుచిత్వ', en: 'Ruchitva' },
  tagline: {
    te: 'కొంపల్లి చిరుధాన్యాల వంటశాల',
    en: 'Millet kitchen, Kompally',
  },
  heroTitle: {
    te: 'ప్రతి ఉదయం, వేడి వేడి చిరుధాన్యాల టిఫిన్ మీ ఇంటికి',
    en: 'Hot millet breakfast at your door, every morning',
  },
  heroBody: {
    te: 'రాగి, కొర్ర, సజ్జ, జొన్న — తాజాగా వండి, సోమవారం నుంచి శుక్రవారం ఉదయం కొంపల్లి చుట్టూ 5 కి.మీ. లోపల ఇళ్లకు, ఆఫీసులకు డెలివరీ. మైదా లేదు, రుచికి రాజీ లేదు.',
    en: 'Ragi, foxtail, bajra, jowar — cooked fresh and delivered Monday to Friday morning to homes and offices within 5 km of Kompally. Zero maida, full flavour.',
  },
  ctaSubscribe: { te: 'సబ్‌స్క్రైబ్ చేయండి', en: 'Subscribe' },
  ctaMine: { te: 'నా సబ్‌స్క్రిప్షన్', en: 'My subscription' },
  ctaWhatsapp: { te: 'వాట్సాప్‌లో మాట్లాడండి', en: 'Chat on WhatsApp' },
  menuTitle: { te: 'ఈ వారం మెనూ', en: "This week's menu" },
  menuNote: {
    te: 'సీజన్ కూరగాయలను బట్టి చిన్న మార్పులు ఉండవచ్చు.',
    en: 'Small changes happen with the season’s vegetables.',
  },
  plansTitle: { te: 'నెలవారీ ప్లాన్‌లు', en: 'Monthly plans' },
  perMonth: { te: 'నెలకు', en: 'per month' },
  planDays: { te: '22 పనిదినాలు', en: '22 weekday deliveries' },
  planUpfront: { te: 'UPI ద్వారా ముందుగా చెల్లింపు', en: 'Paid upfront by UPI' },
  planSkip: {
    te: 'ప్రయాణంలో ఉన్నప్పుడు రోజులు వదిలేయవచ్చు — ఆ రోజులు చివర్లో కలుస్తాయి',
    en: 'Skip days when travelling — those days extend your end date',
  },
  howTitle: { te: 'ఎలా పని చేస్తుంది', en: 'How it works' },
  how1: { te: 'ప్లాన్ ఎంచుకుని ఫారం నింపండి', en: 'Pick a plan and fill the form' },
  how2: { te: 'UPI QR స్కాన్ చేసి చెల్లించండి', en: 'Scan the UPI QR and pay' },
  how3: {
    te: 'మేము వాట్సాప్‌లో నిర్ధారిస్తాము, మరుసటి పనిదినం నుంచి డెలివరీ',
    en: 'We confirm on WhatsApp, delivery starts on your date',
  },
  areaTitle: { te: 'డెలివరీ ప్రాంతం', en: 'Delivery area' },
  areaBody: {
    te: 'కొంపల్లి చుట్టూ 5 కి.మీ. — ఇళ్లు మరియు ఆఫీసులు. సోమ–శుక్ర ఉదయం.',
    en: 'Within 5 km of Kompally — homes and offices. Monday to Friday morning.',
  },

  formTitle: { te: 'సబ్‌స్క్రిప్షన్ ఫారం', en: 'Subscription form' },
  fName: { te: 'పేరు', en: 'Name' },
  fPhone: { te: 'వాట్సాప్ నంబర్', en: 'WhatsApp number' },
  fPhoneHint: { te: '10 అంకెలు', en: '10 digits' },
  fAddress: { te: 'పూర్తి చిరునామా', en: 'Full address' },
  fAddressHint: {
    te: 'ఫ్లాట్ నంబర్, వీధి, ఏరియా, పిన్‌కోడ్',
    en: 'Flat number, street, area, pincode',
  },
  fBuilding: { te: 'అపార్ట్‌మెంట్ / ఆఫీసు పేరు', en: 'Apartment / office name' },
  fLandmark: { te: 'ల్యాండ్‌మార్క్ (దగ్గరి గుర్తు)', en: 'Landmark' },
  fPlan: { te: 'ప్లాన్', en: 'Plan' },
  fStart: { te: 'ఎప్పటి నుంచి మొదలు', en: 'Start date' },
  fStartHint: {
    te: 'శని/ఆదివారం ఎంచుకుంటే, తర్వాత సోమవారం నుంచి మొదలవుతుంది',
    en: 'A weekend date rolls forward to the Monday',
  },
  submit: { te: 'కొనసాగించి చెల్లించండి', en: 'Continue to payment' },
  submitting: { te: 'ఆగండి…', en: 'Please wait…' },
  required: { te: 'ఇది తప్పనిసరి', en: 'This is required' },

  payTitle: { te: 'ఇప్పుడు చెల్లించండి', en: 'Now pay' },
  payAmount: { te: 'చెల్లించాల్సిన మొత్తం', en: 'Amount to pay' },
  payScan: {
    te: 'ఏదైనా UPI యాప్‌తో QR స్కాన్ చేయండి',
    en: 'Scan this QR with any UPI app',
  },
  payOr: { te: 'లేదా ఈ UPI ID కి పంపండి', en: 'Or send to this UPI ID' },
  payCopy: { te: 'కాపీ', en: 'Copy' },
  payCopied: { te: 'కాపీ అయింది', en: 'Copied' },
  payOpenApp: { te: 'UPI యాప్ తెరవండి', en: 'Open UPI app' },
  payRefLabel: { te: 'UPI రిఫరెన్స్ / UTR నంబర్', en: 'UPI reference / UTR number' },
  payRefHint: {
    te: 'చెల్లింపు తర్వాత యాప్‌లో కనిపించే నంబర్',
    en: 'The number your UPI app shows after paying',
  },
  payRefSubmit: { te: 'రిఫరెన్స్ నంబర్ పంపండి', en: 'Submit reference number' },
  paySkipRef: { te: 'తర్వాత వాట్సాప్‌లో పంపుతాను', en: 'I will send it on WhatsApp' },

  doneTitle: { te: 'ధన్యవాదాలు!', en: 'Thank you!' },
  donePending: {
    te: 'మీ సబ్‌స్క్రిప్షన్ — చెల్లింపు నిర్ధారణ కోసం వేచి ఉంది',
    en: 'Your subscription — pending payment confirmation',
  },
  doneBody: {
    te: 'మేము చెల్లింపు చూసిన వెంటనే వాట్సాప్‌లో నిర్ధారణ పంపుతాము. ఏ సందేహమైనా వాట్సాప్ చేయండి.',
    en: 'We will confirm on WhatsApp as soon as we see the payment. Message us any time.',
  },
  doneWhatsapp: { te: 'వాట్సాప్‌లో వివరాలు పంపండి', en: 'Send details on WhatsApp' },

  mineTitle: { te: 'నా సబ్‌స్క్రిప్షన్', en: 'My subscription' },
  minePrompt: {
    te: 'మీ వాట్సాప్ నంబర్ ఇవ్వండి — పాస్‌వర్డ్ అవసరం లేదు',
    en: 'Enter your WhatsApp number — no password needed',
  },
  mineCheck: { te: 'చూడండి', en: 'View' },
  daysLeft: { te: 'మిగిలిన రోజులు', en: 'Days remaining' },
  endsOn: { te: 'ముగిసే తేదీ', en: 'Ends on' },
  planLabel: { te: 'ప్లాన్', en: 'Plan' },
  skipsUsed: { te: 'వదిలిన రోజులు', en: 'Days skipped' },
  statusPending: { te: 'చెల్లింపు నిర్ధారణ కావాలి', en: 'Pending confirmation' },
  statusActive: { te: 'నడుస్తోంది', en: 'Active' },
  statusPaused: { te: 'తాత్కాలికంగా ఆపారు', en: 'Paused' },
  todayYes: { te: 'ఈ రోజు డెలివరీ ఉంది', en: 'Delivery today' },
  todayNo: { te: 'ఈ రోజు డెలివరీ లేదు', en: 'No delivery today' },
  skipTitle: { te: 'రోజులు వదిలేయండి', en: 'Skip days' },
  skipTomorrow: { te: 'రేపు వద్దు', en: 'Skip tomorrow' },
  skipNextDay: { te: 'తర్వాత డెలివరీ రోజు వద్దు', en: 'Skip next delivery day' },
  skipRange: { te: 'కొన్ని రోజులు వద్దు', en: 'Skip a date range' },
  skipFrom: { te: 'ఏ తేదీ నుంచి', en: 'From' },
  skipTo: { te: 'ఏ తేదీ వరకు', en: 'To' },
  skipConfirm: { te: 'వదిలేయండి', en: 'Skip these days' },
  skipLocked: {
    te: 'రాత్రి 8 గంటలు దాటింది — రేపటి డెలివరీ ఇప్పటికే వంటకు వెళ్లింది',
    en: 'It is past 8 PM — tomorrow’s meal is already going to the kitchen',
  },
  skipRule: {
    te: 'ముందు రోజు రాత్రి 8 గంటల లోపు మాత్రమే వదిలేయవచ్చు. వదిలిన రోజులు మీ ముగింపు తేదీకి కలుస్తాయి.',
    en: 'Skips must be in before 8 PM the previous night. Skipped days extend your end date.',
  },
  skippedDays: { te: 'వదిలిన రోజులు', en: 'Skipped days' },
  skipAlready: { te: 'ఆ రోజులు ఇప్పటికే వదిలేశారు.', en: 'Those days are already skipped.' },
  skipNoDeliveryDays: {
    te: 'ఆ తేదీల మధ్య డెలివరీ రోజులు లేవు (శని, ఆదివారం డెలివరీ ఉండదు).',
    en: 'There are no delivery days in that range — we do not deliver on weekends.',
  },
  undo: { te: 'రద్దు', en: 'Undo' },
  noneFound: {
    te: 'ఈ నంబర్‌తో సబ్‌స్క్రిప్షన్ కనిపించలేదు. వాట్సాప్ చేయండి.',
    en: 'No subscription found for this number. Please message us on WhatsApp.',
  },
  back: { te: 'వెనక్కి', en: 'Back' },
  loading: { te: 'లోడ్ అవుతోంది…', en: 'Loading…' },
  renewSoon: {
    te: 'మీ ప్లాన్ ముగియబోతోంది — రెన్యువల్ కోసం వాట్సాప్ చేయండి',
    en: 'Your plan is ending soon — message us to renew',
  },
} satisfies Record<string, Entry>;

export type CopyKey = keyof typeof COPY;

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: CopyKey) => string;
}

const LangContext = createContext<LangValue | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'te') return saved;
  } catch {
    /* private mode */
  }
  return 'te'; // Telugu first
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: (key) => COPY[key][lang] }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
