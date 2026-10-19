export type SupportedLanguage = 'en' | 'es' | 'pt-BR' | 'hi' | 'de' | 'fr';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' }
];

const STORAGE_KEY = 'everycalc_language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

type TranslationDictionary = Record<string, string>;

const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appTitle: 'EveryCalc - All-in-One Multi Calculator',
    appDescription: 'High-precision, offline-first multi-functional calculator suite.',
    searchPlaceholder: 'Search calculators (Ctrl+K)...',
    history: 'History',
    settings: 'Settings',
    theme: 'Theme',
    clearHistory: 'Clear History',
    noHistory: 'No calculation history yet',
    copyResult: 'Click to copy result',
    copiedToClipboard: 'Copied {value} to clipboard',
    pasted: 'Pasted {value}',
    angleMode: 'Angle Mode',
    hapticFeedback: 'Haptic Feedback',
    soundFeedback: 'Keypad Sound',
    defaultCalculator: 'Default Calculator',
    numberFormat: 'Number Formatting',
    precision: 'Decimal Precision',
    masterPrecision: 'Master Precision',
    financePrecision: 'Financial & Currency Precision',
    unitPrecision: 'Unit Converter Precision',
    autoPrecision: 'Auto (Dynamic)',
    language: 'Language',
    calculators: 'Calculators',
    historyTape: 'Calculation History Tape',
    clear: 'Clear',
    result: 'Result',
    originalPrice: 'Original Price',
    discount: 'Discount (%)',
    additionalDiscount: 'Additional Discount (%) [Optional]',
    salesTax: 'Sales Tax (%) [Optional]',
    finalPrice: 'Final Price',
    totalSavings: 'Total Savings',
    taxAmount: 'Tax Amount',
    from: 'From',
    to: 'To',
    swapUnits: '⇅ Swap Units',
    PER_card1_title: 'What is X% of Y?',
    PER_what_is: 'What is',
    PER_pct_of: '% of',
    PER_card2_title: 'X is what % of Y?',
    PER_is_what_pct_of: 'is what % of',
    PER_card3_title: 'Percentage Increase / Decrease',
    PER_from: 'From',
    PER_to: 'to',
    PER_change: 'Change',
    PER_percentage: 'Percentage',
    on: 'ON',
    off: 'OFF',
    deg: 'DEG',
    rad: 'RAD',
    // Modules
    NOR_name: 'General Calculator',
    NOR_desc: 'Standard arithmetic & scientific calculation engine.',
    TAX_name: 'GST / Sales Tax',
    TAX_desc: 'Calculate GST, VAT, and sales tax with net and gross breakdowns.',
    GLD_name: 'Gold & Jewelry Price',
    GLD_desc: 'Calculate pure gold, making charges, and jewelry invoice value.',
    LON_name: 'Loan EMI Calculator',
    LON_desc: 'Calculate loan EMI, total interest, and amortization schedule.',
    IRA_name: 'SIP / FD / Savings',
    IRA_desc: 'Project mutual fund SIP returns, fixed deposit interest, and wealth growth.',
    ITX_name: 'Income Tax Calculator',
    ITX_desc: 'Compare New vs Old tax regimes with deductions and tax slabs.',
    SAL_name: 'In-Hand Salary Calculator',
    SAL_desc: 'Calculate take-home salary after PF, professional tax, and TDS deductions.',
    UNT_name: 'Unit Converter',
    UNT_desc: 'Convert length, weight, area, volume, and temperature units.',
    CUR_name: 'Currency Converter',
    CUR_desc: 'Real-time multi-currency exchange rate calculator.',
    PPP_name: 'Purchasing Power Parity (PPP)',
    PPP_desc: 'Compare international salaries and real cost of living across countries.',
    DCT_name: 'Discount Calculator',
    DCT_desc: 'Calculate final discounted price, double discounts, and savings amount.',
    TIP_name: 'Tip Calculator',
    TIP_desc: 'Calculate tip percentage and split bill evenly among guests.',
    PER_name: 'Percentage Calculator',
    PER_desc: 'Calculate percentage increase, decrease, fraction, and percentage of value.',
    UPR_name: 'Unit Price Calculator',
    UPR_desc: 'Compare cost per gram, kilogram, liter, or unit to find best deals.',
    DAT_name: 'Date Calculator',
    DAT_desc: 'Calculate days between dates, age, and add/subtract duration.',
    HET_name: 'Health (BMI & BMR)',
    HET_desc: 'Calculate Body Mass Index (BMI) and daily caloric requirement (BMR).',
    FCS_name: 'Fuel Cost Calculator',
    FCS_desc: 'Calculate trip fuel cost based on distance and fuel price.',
    FFC_name: 'Fuel Efficiency',
    FFC_desc: 'Convert mileage between MPG, km/L, and L/100km.',
    GPA_name: 'Grade Average (GPA)',
    GPA_desc: 'Calculate semester and cumulative Grade Point Average.',
    HEX_name: 'Hexadecimal Converter',
    HEX_desc: 'Convert numbers between decimal, hexadecimal, binary, and octal.',
    LDC_name: 'Ovulation Calculator',
    LDC_desc: 'Track menstrual cycles and calculate fertile window & ovulation.',
    TMZ_name: 'World Timezone',
    TMZ_desc: 'Compare time zones across major international cities.',
    ANN_name: 'Anniversary & D-Day',
    ANN_desc: 'Track countdowns, anniversaries, birthdays, and milestone days.'
  },
  es: {
    appTitle: 'EveryCalc - Calculadora Multifuncional Online',
    appDescription: 'Calculadora online rápida, offline y de alta precisión con más de 20 herramientas.',
    searchPlaceholder: 'Buscar calculadoras (Ctrl+K)...',
    history: 'Historial',
    settings: 'Ajustes',
    theme: 'Tema',
    clearHistory: 'Borrar historial',
    noHistory: 'Sin historial de cálculos',
    copyResult: 'Clic para copiar resultado',
    copiedToClipboard: 'Copiado {value} al portapapeles',
    pasted: 'Pegado {value}',
    angleMode: 'Modo de ángulo',
    hapticFeedback: 'Vibración háptica',
    soundFeedback: 'Sonido de teclado',
    defaultCalculator: 'Calculadora predeterminada',
    language: 'Idioma',
    calculators: 'Calculadoras',
    historyTape: 'Tira de Historial',
    clear: 'Borrar',
    result: 'Resultado',
    originalPrice: 'Precio original',
    discount: 'Descuento (%)',
    additionalDiscount: 'Descuento adicional (%) [Opcional]',
    salesTax: 'Impuesto de venta (%) [Opcional]',
    finalPrice: 'Precio final',
    totalSavings: 'Ahorro total',
    taxAmount: 'Monto de impuestos',
    from: 'De',
    to: 'A',
    swapUnits: '⇅ Intercambiar Unidades',
    PER_card1_title: '¿Cuánto es el X% de Y?',
    PER_what_is: 'Cuánto es el',
    PER_pct_of: '% de',
    PER_card2_title: '¿X qué porcentaje es de Y?',
    PER_is_what_pct_of: 'es qué % de',
    PER_card3_title: 'Aumento / Disminución porcentual',
    PER_from: 'De',
    PER_to: 'a',
    PER_change: 'Variación',
    PER_percentage: 'Porcentaje',
    on: 'SÍ',
    off: 'NO',
    deg: 'DEG',
    rad: 'RAD',
    // Modules
    NOR_name: 'Calculadora General',
    NOR_desc: 'Calculadora aritmética estándar y científica de alta precisión.',
    TAX_name: 'Calculadora de IVA e Impuestos',
    TAX_desc: 'Calcula IVA, desglose de impuestos y precios netos y brutos.',
    GLD_name: 'Precio de Oro y Joyería',
    GLD_desc: 'Calcula el precio del oro puro, mano de obra y factura final.',
    LON_name: 'Calculadora de Préstamos e Hipotecas',
    LON_desc: 'Calcula cuotas mensuales (EMI), intereses totales y cronograma.',
    IRA_name: 'Inversiones y Ahorros (SIP/Plazo Fijo)',
    IRA_desc: 'Calcula el rendimiento de inversiones periódicas y plazos fijos.',
    ITX_name: 'Calculadora de Impuesto sobre la Renta',
    ITX_desc: 'Estima impuestos sobre ingresos y deducciones fiscales.',
    SAL_name: 'Calculadora de Salario Neto',
    SAL_desc: 'Calcula tu salario neto en mano tras impuestos y retenciones.',
    UNT_name: 'Conversor de Unidades',
    UNT_desc: 'Convierte longitud, peso, superficie, volumen y temperatura.',
    CUR_name: 'Conversor de Divisas',
    CUR_desc: 'Calcula el tipo de cambio entre monedas internacionales en tiempo real.',
    PPP_name: 'Paridad de Poder Adquisitivo (PPA)',
    PPP_desc: 'Compara salarios internacionales y costo de vida real entre países.',
    DCT_name: 'Calculadora de Descuentos',
    DCT_desc: 'Calcula el precio final con descuento y tu ahorro exacto.',
    TIP_name: 'Calculadora de Propinas',
    TIP_desc: 'Calcula propinas y divide la cuenta equitativamente entre amigos.',
    PER_name: 'Calculadora de Porcentajes',
    PER_desc: 'Calcula porcentajes, aumentos, disminuciones y variaciones rápidamente.',
    UPR_name: 'Calculadora de Precio Unitario',
    UPR_desc: 'Compara precios por kilo, litro o unidad para encontrar la mejor oferta.',
    DAT_name: 'Calculadora de Fechas y Edad',
    DAT_desc: 'Calcula días transcurridos entre dos fechas y edad exacta.',
    HET_name: 'Salud (IMC y TMB)',
    HET_desc: 'Calcula tu Índice de Masa Corporal (IMC) y gasto calórico diario.',
    FCS_name: 'Costo de Combustible',
    FCS_desc: 'Calcula el costo de gasolina o diésel para cualquier viaje.',
    FFC_name: 'Consumo de Combustible',
    FFC_desc: 'Convierte el rendimiento de combustible entre km/L, L/100km y MPG.',
    GPA_name: 'Promedio de Calificaciones (GPA)',
    GPA_desc: 'Calcula el promedio ponderado de notas y créditos académicos.',
    HEX_name: 'Conversor Hexadecimal y Binario',
    HEX_desc: 'Convierte valores entre decimal, hexadecimal, binario y octal.',
    LDC_name: 'Calculadora de Ovulación y Fertilidad',
    LDC_desc: 'Calcula tu ventana fértil y días probables de ovulación.',
    TMZ_name: 'Zonas Horarias Mundiales',
    TMZ_desc: 'Compara horarios entre las principales ciudades del mundo.'
  },
  'pt-BR': {
    appTitle: 'EveryCalc - Calculadora Online Multifuncional',
    appDescription: 'Calculadora online rápida, offline e precisa com mais de 20 ferramentas em português.',
    searchPlaceholder: 'Pesquisar calculadoras (Ctrl+K)...',
    history: 'Histórico',
    settings: 'Configurações',
    theme: 'Tema',
    clearHistory: 'Limpar histórico',
    noHistory: 'Nenhum cálculo no histórico',
    copyResult: 'Clique para copiar o resultado',
    copiedToClipboard: 'Copiado {value} para a área de transferência',
    pasted: 'Colado {value}',
    angleMode: 'Modo Angular',
    hapticFeedback: 'Vibração tátil',
    soundFeedback: 'Som das teclas',
    defaultCalculator: 'Calculadora padrão',
    language: 'Idioma',
    calculators: 'Calculadoras',
    historyTape: 'Fita de Histórico',
    clear: 'Limpar',
    result: 'Resultado',
    originalPrice: 'Preço original',
    discount: 'Desconto (%)',
    additionalDiscount: 'Desconto adicional (%) [Opcional]',
    salesTax: 'Imposto / Tributo (%) [Opcional]',
    finalPrice: 'Preço final',
    totalSavings: 'Economia total',
    taxAmount: 'Valor do imposto',
    from: 'De',
    to: 'Para',
    swapUnits: '⇅ Inverter Unidades',
    PER_card1_title: 'Quanto é X% de Y?',
    PER_what_is: 'Quanto é',
    PER_pct_of: '% de',
    PER_card2_title: 'X é quantos % de Y?',
    PER_is_what_pct_of: 'é quantos % de',
    PER_card3_title: 'Aumento / Redução percentual',
    PER_from: 'De',
    PER_to: 'para',
    PER_change: 'Variação',
    PER_percentage: 'Porcentagem',
    on: 'LIG',
    off: 'DESL',
    deg: 'GRAUS',
    rad: 'RAD',
    // Modules
    NOR_name: 'Calculadora Geral e Científica',
    NOR_desc: 'Calculadora padrão e científica online com precisão absoluta.',
    TAX_name: 'Calculadora de Impostos e Tributos',
    TAX_desc: 'Calcule alíquotas de impostos, preços líquidos e brutos.',
    GLD_name: 'Preço do Ouro e Joias',
    GLD_desc: 'Calcule o valor do grama de ouro, feitio e nota fiscal.',
    LON_name: 'Calculadora de Empréstimos e Financiamento',
    LON_desc: 'Calcule parcelas mensais, juros totais e custo efetivo de empréstimos.',
    IRA_name: 'Calculadora de Investimentos e Poupança',
    IRA_desc: 'Simule rendimento de poupança, CDI, CDB e juros compostos.',
    ITX_name: 'Calculadora de Imposto de Renda',
    ITX_desc: 'Simule faixas de imposto, deduções e valor a pagar ou restituir.',
    SAL_name: 'Calculadora de Salário Líquido',
    SAL_desc: 'Descubra quanto você recebe na mão após descontos de INSS e IRRF.',
    UNT_name: 'Conversor de Unidades',
    UNT_desc: 'Converta medidas de comprimento, peso, volume, área e temperatura.',
    CUR_name: 'Conversor de Moedas',
    CUR_desc: 'Converta cotações de moedas internacionais em tempo real.',
    PPP_name: 'Paridade do Poder de Compra (PPC)',
    PPP_desc: 'Compare salários internacionais e custo de vida real entre países.',
    DCT_name: 'Calculadora de Desconto',
    DCT_desc: 'Calcule preço com desconto, economia real e promoções.',
    TIP_name: 'Calculadora de Gorjeta e Divisão de Conta',
    TIP_desc: 'Calcule a porcentagem de gorjeta e divida o valor entre pessoas.',
    PER_name: 'Calculadora de Porcentagem',
    PER_desc: 'Calcule porcentagens, acréscimos, descontos percentuais e frações.',
    UPR_name: 'Calculadora de Preço Unitário',
    UPR_desc: 'Compare o preço por quilo, litro ou unidade para economizar no mercado.',
    DAT_name: 'Calculadora de Datas e Idade',
    DAT_desc: 'Calcule dias entre datas, contagem regressiva e idade exata.',
    HET_name: 'Saúde (Calculadora de IMC e TMB)',
    HET_desc: 'Calcule o Índice de Massa Corporal (IMC) e taxa metabólica basal.',
    FCS_name: 'Calculadora de Custo de Combustível',
    FCS_desc: 'Calcule o gasto com gasolina, etanol ou diesel para viagens.',
    FFC_name: 'Consumo de Combustível',
    FFC_desc: 'Converta médias de consumo em km/L, L/100km e MPG.',
    GPA_name: 'Média de Notas (GPA)',
    GPA_desc: 'Calcule médias escolares e universitárias ponderadas por créditos.',
    HEX_name: 'Conversor Hexadecimal e Binário',
    HEX_desc: 'Converta números entre decimal, hexadecimal, binário e octal.',
    LDC_name: 'Calculadora de Ovulação e Período Fértil',
    LDC_desc: 'Acompanhe seu ciclo e descubra o dia exato da ovulação.',
    TMZ_name: 'Fuso Horário Mundial',
    TMZ_desc: 'Compare o horário entre capitais e fusos horários do mundo.'
  },
  hi: {
    appTitle: 'EveryCalc - ऑल-इन-वन बहुउद्देशीय कैलकुलेटर',
    appDescription: 'सटीक, ऑफ़लाइन चलने वाला वैज्ञानिक एवं वित्तीय कैलकुलेटर सूट।',
    searchPlaceholder: 'कैलकुलेटर खोजें (Ctrl+K)...',
    history: 'इतिहास',
    settings: 'सेटिंग्स',
    theme: 'थीम',
    clearHistory: 'इतिहास साफ़ करें',
    noHistory: 'कोई गणना इतिहास नहीं है',
    copyResult: 'परिणाम कॉपी करने के लिए क्लिक करें',
    copiedToClipboard: '{value} क्लिपबोर्ड पर कॉपी किया गया',
    pasted: '{value} पेस्ट किया गया',
    angleMode: 'कोण मोड',
    hapticFeedback: 'वाइब्रेशन',
    soundFeedback: 'कीपैड आवाज़',
    defaultCalculator: 'डिफ़ॉल्ट कैलकुलेटर',
    language: 'भाषा',
    calculators: 'कैलकुलेटर',
    historyTape: 'गणना इतिहास टेप',
    clear: 'साफ़ करें',
    result: 'परिणाम',
    originalPrice: 'मूल कीमत',
    discount: 'छूट (%)',
    additionalDiscount: 'अतिरिक्त छूट (%) [वैकल्पिक]',
    salesTax: 'बिक्री कर (%) [वैकल्पिक]',
    finalPrice: 'अंतिम कीमत',
    totalSavings: 'कुल बचत',
    taxAmount: 'कर राशि',
    from: 'से',
    to: 'तक',
    swapUnits: '⇅ इकाइयाँ बदलें',
    PER_card1_title: 'Y का X% कितना है?',
    PER_what_is: 'क्या है',
    PER_pct_of: '% का',
    PER_card2_title: 'X, Y का कितना % है?',
    PER_is_what_pct_of: 'कितना % है',
    PER_card3_title: 'प्रतिशत वृद्धि / कमी',
    PER_from: 'से',
    PER_to: 'तक',
    PER_change: 'परिवर्तन',
    PER_percentage: 'प्रतिशत',
    on: 'चालू',
    off: 'बंद',
    deg: 'DEG',
    rad: 'RAD',
    // Modules
    NOR_name: 'सामान्य कैलकुलेटर',
    NOR_desc: 'मानक अंकगणित और वैज्ञानिक गणना कैलकुलेटर।',
    TAX_name: 'जीएसटी और टैक्स कैलकुलेटर',
    TAX_desc: 'जीएसटी और बिक्री कर की त्वरित गणना करें।',
    GLD_name: 'सोना और आभूषण मूल्य कैलकुलेटर',
    GLD_desc: 'सोने का भाव, मेकिंग चार्ज और बिल का कुल मूल्य निकालें।',
    LON_name: 'ऋण ईएमआई कैलकुलेटर',
    LON_desc: 'मासिक ईएमआई, कुल ब्याज और ऋण भुगतान की गणना करें।',
    IRA_name: 'एसआईपी और एफडी कैलकुलेटर',
    IRA_desc: 'म्यूचुअल फंड एसआईपी रिटर्न और एफडी ब्याज दरें निकालें।',
    ITX_name: 'आयकर कैलकुलेटर (नया बनाम पुराना)',
    ITX_desc: 'आयकर स्लैब और टैक्स छूट की तुलना करें।',
    SAL_name: 'इन-हैंड सैलरी कैलकुलेटर',
    SAL_desc: 'पीएफ और टीडीएस कटने के बाद हाथ में आने वाला वेतन जानें।',
    UNT_name: 'इकाई परिवर्तक',
    UNT_desc: 'लंबाई, वजन, क्षेत्रफल, आयतन और तापमान को बदलें।',
    CUR_name: 'मुद्रा परिवर्तक',
    CUR_desc: 'विदेशी मुद्रा विनिमय दरों की त्वरित गणना करें।',
    PPP_name: 'क्रय शक्ति समता (PPP)',
    PPP_desc: 'अंतरराष्ट्रीय वेतन और विभिन्न देशों के वास्तविक जीवन स्तर की तुलना करें।',
    DCT_name: 'छूट (डिस्काउंट) कैलकुलेटर',
    DCT_desc: 'दुकान की छूट के बाद अंतिम कीमत और बचत जानें।',
    TIP_name: 'टिप कैलकुलेटर',
    TIP_desc: 'रेस्तरां टिप और बिल का प्रति व्यक्ति बंटवारा करें।',
    PER_name: 'प्रतिशत कैलकुलेटर',
    PER_desc: 'प्रतिशत वृद्धि, कमी और हिस्सेदारी की त्वरित गणना करें।',
    UPR_name: 'इकाई मूल्य कैलकुलेटर',
    UPR_desc: 'प्रति किलो या प्रति लीटर कीमत की तुलना करें।',
    DAT_name: 'दिनांक और आयु कैलकुलेटर',
    DAT_desc: 'दो तिथियों के बीच के दिन और अपनी सटीक उम्र जानें।',
    HET_name: 'स्वास्थ्य (बीएमआई और बीएमआर)',
    HET_desc: 'बॉडी मास इंडेक्स और दैनिक कैलोरी आवश्यकता निकालें।',
    FCS_name: 'ईंधन लागत कैलकुलेटर',
    FCS_desc: 'सफ़र में पेट्रोल या डीजल का कुल खर्च जानें।',
    FFC_name: 'ईंधन दक्षता (माइलेज)',
    FFC_desc: 'वाहन के माइलेज और ईंधन खपत की गणना करें।',
    GPA_name: 'जीपीए कैलकुलेटर',
    GPA_desc: 'परीक्षा ग्रेड और क्रेडिट अंक का औसत निकालें।',
    HEX_name: 'हेक्साडेसिमल कन्वर्टर',
    HEX_desc: 'दशमलव, हेक्साडेसिमल और बाइनरी को आपस में बदलें।',
    LDC_name: 'ओव्यूलेशन कैलकुलेटर',
    LDC_desc: 'मासिक धर्म चक्र और गर्भधारण के सबसे अनुकूल दिन जानें।',
    TMZ_name: 'विश्व समय क्षेत्र',
    TMZ_desc: 'दुनिया भर के प्रमुख शहरों के समय की तुलना करें।'
  },
  de: {
    appTitle: 'EveryCalc - Multifunktionaler Online-Rechner',
    appDescription: 'Präziser, offlinefähiger Online-Rechner mit über 20 spezialisierten Werkzeugen.',
    searchPlaceholder: 'Rechner suchen (Strg+K)...',
    history: 'Verlauf',
    settings: 'Einstellungen',
    theme: 'Design',
    clearHistory: 'Verlauf löschen',
    noHistory: 'Noch kein Berechnungsverlauf',
    copyResult: 'Klicken zum Kopieren',
    copiedToClipboard: '{value} in die Zwischenablage kopiert',
    pasted: '{value} eingefügt',
    angleMode: 'Winkelmodus',
    hapticFeedback: 'Haptisches Feedback',
    soundFeedback: 'Tastenton',
    defaultCalculator: 'Standardrechner',
    language: 'Sprache',
    calculators: 'Rechner',
    historyTape: 'Berechnungsverlauf',
    clear: 'Löschen',
    result: 'Ergebnis',
    originalPrice: 'Ursprünglicher Preis',
    discount: 'Rabatt (%)',
    additionalDiscount: 'Zusatzrabatt (%) [Optional]',
    salesTax: 'Mehrwertsteuer (%) [Optional]',
    finalPrice: 'Endpreis',
    totalSavings: 'Gesamtersparnis',
    taxAmount: 'Steuerbetrag',
    from: 'Von',
    to: 'Nach',
    swapUnits: '⇅ Einheiten tauschen',
    PER_card1_title: 'Was sind X% von Y?',
    PER_what_is: 'Was sind',
    PER_pct_of: '% von',
    PER_card2_title: 'X ist wie viel % von Y?',
    PER_is_what_pct_of: 'ist wie viel % von',
    PER_card3_title: 'Prozentuale Zu- / Abnahme',
    PER_from: 'Von',
    PER_to: 'auf',
    PER_change: 'Veränderung',
    PER_percentage: 'Prozentsatz',
    on: 'AN',
    off: 'AUS',
    deg: 'DEG',
    rad: 'RAD',
    // Modules
    NOR_name: 'Standard- & Wissenschaftsrechner',
    NOR_desc: 'Standard- und wissenschaftlicher Rechner mit höchster Präzision.',
    TAX_name: 'Mehrwertsteuerrechner (MwSt.)',
    TAX_desc: 'Berechnen Sie Netto-, Bruttobeträge und Mehrwertsteuer.',
    GLD_name: 'Gold- & Schmuckpreisrechner',
    GLD_desc: 'Berechnen Sie den Wert von Feingold und Schmuckstücken.',
    LON_name: 'Kredit- & Darlehensrechner',
    LON_desc: 'Monatliche Kreditraten (Tilgung), Zinsen und Gesamtkosten berechnen.',
    IRA_name: 'Spar- & Zinseszinsrechner',
    IRA_desc: 'Berechnen Sie Zinseszinsen, Sparpläne und Vermögenszuwachs.',
    ITX_name: 'Einkommensteuerrechner',
    ITX_desc: 'Einkommensteuer und Abzüge einfach überschlagen.',
    SAL_name: 'Nettogehaltsrechner',
    SAL_desc: 'Berechnen Sie Ihr Auszahlungsgehalt nach Steuern und Sozialabgaben.',
    UNT_name: 'Einheitenumrechner',
    UNT_desc: 'Einheiten für Länge, Gewicht, Fläche, Volumen und Temperatur umrechnen.',
    CUR_name: 'Währungsrechner',
    CUR_desc: 'Aktuelle Devisenkurse in Echtzeit umrechnen.',
    PPP_name: 'Kaufkraftparität (KKP)',
    PPP_desc: 'Internationale Gehälter und reale Lebenshaltungskosten vergleichen.',
    DCT_name: 'Rabattrechner',
    DCT_desc: 'Endpreis nach Rabatten und tatsächliche Ersparnis berechnen.',
    TIP_name: 'Trinkgeldrechner',
    TIP_desc: 'Trinkgeld berechnen und Rechnungsbetrag fair aufteilen.',
    PER_name: 'Prozentrechner',
    PER_desc: 'Prozentualen Anstieg, Abschlag, Anteile und Prozentwerte berechnen.',
    UPR_name: 'Grundpreisrechner',
    UPR_desc: 'Preise pro Kilogramm, Liter oder Stück für günstige Einkäufe vergleichen.',
    DAT_name: 'Datums- & Altersrechner',
    DAT_desc: 'Tage zwischen zwei Daten und genaues Alter berechnen.',
    HET_name: 'Gesundheit (BMI & Grundumsatz)',
    HET_desc: 'Body-Mass-Index (BMI) und täglichen Kalorienbedarf berechnen.',
    FCS_name: 'Spritkostenrechner',
    FCS_desc: 'Kraftstoffkosten für Reisen und Fahrstrecken ermitteln.',
    FFC_name: 'Kraftstoffverbrauch',
    FFC_desc: 'Verbrauch zwischen l/100km, km/l und MPG umrechnen.',
    GPA_name: 'Notendurchschnittsrechner',
    GPA_desc: 'Gewichteten Notendurchschnitt für Schule und Studium ermitteln.',
    HEX_name: 'Hexadezimal- & Binärrechner',
    HEX_desc: 'Zahlen zwischen Dezimal, Hexadezimal, Binär und Oktal konvertieren.',
    LDC_name: 'Eisprung- & Fruchtbarkeitsrechner',
    LDC_desc: 'Fruchtbare Tage und voraussichtlichen Eisprung berechnen.',
    TMZ_name: 'Zeitzonenrechner',
    TMZ_desc: 'Uhrzeiten weltweit in verschiedenen Zeitzonen vergleichen.'
  },
  fr: {
    appTitle: 'EveryCalc - Calculatrice Multifonction en Ligne',
    appDescription: 'Calculatrice en ligne rapide, hors ligne et ultra-précise avec plus de 20 outils.',
    searchPlaceholder: 'Rechercher des calculatrices (Ctrl+K)...',
    history: 'Historique',
    settings: 'Paramètres',
    theme: 'Thème',
    clearHistory: 'Effacer l’historique',
    noHistory: 'Aucun historique de calcul',
    copyResult: 'Cliquer pour copier le résultat',
    copiedToClipboard: '{value} copié dans le presse-papier',
    pasted: '{value} collé',
    angleMode: 'Mode d’angle',
    hapticFeedback: 'Retour haptique',
    soundFeedback: 'Son du clavier',
    defaultCalculator: 'Calculatrice par défaut',
    language: 'Langue',
    calculators: 'Calculatrices',
    historyTape: 'Ruban d’historique',
    clear: 'Effacer',
    result: 'Résultat',
    originalPrice: 'Prix d’origine',
    discount: 'Remise (%)',
    additionalDiscount: 'Remise additionnelle (%) [Optionnel]',
    salesTax: 'Taxe / TVA (%) [Optionnel]',
    finalPrice: 'Prix final',
    totalSavings: 'Économie totale',
    taxAmount: 'Montant de taxe',
    from: 'De',
    to: 'Vers',
    swapUnits: '⇅ Inverser les unités',
    PER_card1_title: 'Combien fait X% de Y ?',
    PER_what_is: 'Combien fait',
    PER_pct_of: '% de',
    PER_card2_title: 'X représente quel % de Y ?',
    PER_is_what_pct_of: 'représente quel % de',
    PER_card3_title: 'Augmentation / Réduction en pourcentage',
    PER_from: 'De',
    PER_to: 'à',
    PER_change: 'Variation',
    PER_percentage: 'Pourcentage',
    on: 'OUI',
    off: 'NON',
    deg: 'DEG',
    rad: 'RAD',
    // Modules
    NOR_name: 'Calculatrice Générale & Scientifique',
    NOR_desc: 'Calculatrice arithmétique et scientifique standard de haute précision.',
    TAX_name: 'Calculateur de TVA & Taxes',
    TAX_desc: 'Calculez la TVA, les montants hors taxe (HT) et toutes taxes comprises (TTC).',
    GLD_name: 'Prix de l’Or et Bijouterie',
    GLD_desc: 'Calculez la valeur de l’or pur, frais de fabrication et prix total.',
    LON_name: 'Calculateur de Prêt & Crédit',
    LON_desc: 'Calculez vos mensualités de crédit, intérêts totaux et tableau d’amortissement.',
    IRA_name: 'Épargne & Intérêts Composés',
    IRA_desc: 'Estimez les intérêts de vos placements et plans d’épargne réguliers.',
    ITX_name: 'Calculateur d’Impôt sur le Revenu',
    ITX_desc: 'Estimez vos tranches d’imposition et déductions fiscales.',
    SAL_name: 'Calculateur Salaire Brut / Net',
    SAL_desc: 'Convertissez votre salaire brut en salaire net perçu après cotisations.',
    UNT_name: 'Convertisseur d’Unités',
    UNT_desc: 'Convertissez longueur, poids, surface, volume et température.',
    CUR_name: 'Convertisseur de Devises',
    CUR_desc: 'Convertissez les devises internationales avec taux de change en direct.',
    PPP_name: 'Parité de Pouvoir d’Achat (PPA)',
    PPP_desc: 'Comparez les salaires internationaux et le coût réel de la vie entre pays.',
    DCT_name: 'Calculateur de Réduction & Solde',
    DCT_desc: 'Calculez le prix soldé et le montant total économisé.',
    TIP_name: 'Calculateur de Pourboire & Partage',
    TIP_desc: 'Calculez le pourboire et divisez la note équitablement.',
    PER_name: 'Calculateur de Pourcentage',
    PER_desc: 'Calculez augmentations, réductions, pourcentages et ratios.',
    UPR_name: 'Calculateur de Prix Unitaire',
    UPR_desc: 'Comparez le prix au kilo, au litre ou à l’unité pour faire des économies.',
    DAT_name: 'Calculateur de Date & Âge',
    DAT_desc: 'Calculez le nombre de jours entre deux dates et votre âge exact.',
    HET_name: 'Santé (Calculateur IMC & MB)',
    HET_desc: 'Calculez votre Indice de Masse Corporelle (IMC) et métabolisme de base.',
    FCS_name: 'Coût du Carburant',
    FCS_desc: 'Calculez le coût en essence ou diesel pour tout trajet.',
    FFC_name: 'Consommation de Carburant',
    FFC_desc: 'Convertissez la consommation en L/100km, km/L et MPG.',
    GPA_name: 'Calculateur de Moyenne (GPA)',
    GPA_desc: 'Calculez la moyenne générale pondérée de vos notes et crédits.',
    HEX_name: 'Convertisseur Hexadécimal & Binaire',
    HEX_desc: 'Convertissez entre décimal, hexadécimal, binaire et octal.',
    LDC_name: 'Calculateur d’Ovulation & Fertilité',
    LDC_desc: 'Suivez vos cycles et déterminez votre période d’ovulation.',
    TMZ_name: 'Fuseaux Horaires du Monde',
    TMZ_desc: 'Comparez l’heure locale entre différentes villes du monde.'
  }
};

let currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

/**
 * Validates if a code is a supported language
 */
export function isSupportedLanguage(code: string | null | undefined): code is SupportedLanguage {
  if (!code) return false;
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}

/**
 * Initializes and detects the user language from URL param (?lang=) or localStorage or browser navigator.
 */
export function initLanguage(): SupportedLanguage {
  // 1. Check URL param ?lang=
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang');
    if (isSupportedLanguage(paramLang)) {
      setLanguage(paramLang, false);
      return paramLang;
    }
  }

  // 2. Check localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isSupportedLanguage(stored)) {
        currentLanguage = stored;
        updateDocumentAttributes(stored);
        return stored;
      }
    } catch {
      // Storage unavailable
    }
  }

  // 3. Check browser navigator language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const nav = navigator.language;
    if (nav.toLowerCase().startsWith('pt')) {
      currentLanguage = 'pt-BR';
    } else if (nav.toLowerCase().startsWith('es')) {
      currentLanguage = 'es';
    } else if (nav.toLowerCase().startsWith('hi')) {
      currentLanguage = 'hi';
    } else if (nav.toLowerCase().startsWith('de')) {
      currentLanguage = 'de';
    } else if (nav.toLowerCase().startsWith('fr')) {
      currentLanguage = 'fr';
    } else {
      currentLanguage = 'en';
    }
  } else {
    currentLanguage = DEFAULT_LANGUAGE;
  }

  updateDocumentAttributes(currentLanguage);
  return currentLanguage;
}

/**
 * Gets the current active language
 */
export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * Sets the active language and updates document tags + storage
 */
export function setLanguage(lang: SupportedLanguage, updateUrl: boolean = true): void {
  currentLanguage = lang;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable
    }
  }
  updateDocumentAttributes(lang);

  if (updateUrl && typeof window !== 'undefined' && window.history && window.location) {
    const url = new URL(window.location.href);
    if (lang === 'en') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', lang);
    }
    window.history.replaceState({}, '', url.toString());
  }
}

function updateDocumentAttributes(lang: SupportedLanguage): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

/**
 * Translates a key with optional string parameter replacements: {name}
 */
export function t(key: string, params?: Record<string, string>): string {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return text;
}

/**
 * Updates page <title> and <meta name="description"> for search engines and social cards
 */
export function updatePageSEO(moduleId: string, lang: SupportedLanguage = currentLanguage): void {
  if (typeof document === 'undefined') return;

  const moduleName = t(`${moduleId}_name`);
  const moduleDesc = t(`${moduleId}_desc`);
  const siteTitle = 'EveryCalc';

  const fullTitle = moduleId === 'NOR'
    ? `${moduleName} - ${siteTitle}`
    : `${moduleName} | ${siteTitle}`;
  const metaDesc = moduleDesc || t('appDescription');

  document.title = fullTitle;

  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', metaDesc);

  // Update OpenGraph tags if present
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', fullTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', metaDesc);

  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) {
    const localeMap: Record<SupportedLanguage, string> = {
      en: 'en_US',
      es: 'es_ES',
      'pt-BR': 'pt_BR',
      hi: 'hi_IN',
      de: 'de_DE',
      fr: 'fr_FR'
    };
    ogLocale.setAttribute('content', localeMap[lang] || 'en_US');
  }
}
