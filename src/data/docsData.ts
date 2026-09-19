export interface DocSection {
  id: string;
  title: string;
  level: 2 | 3;
  content: string;
  tips?: string[];
  warning?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface DocArticle {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  category: 'getting-started' | 'core-services' | 'cases-media' | 'publishing-seo' | 'account-billing';
  categoryTitleAr: string;
  badge?: string;
  readingTime: string;
  lastUpdated: string;
  summaryAr: string;
  sections: DocSection[];
  svgDiagramType?: 'quickstart' | 'cv-flow' | 'portfolio-flow' | 'case-limits' | 'image-pipeline' | 'deploy-flow' | 'personal-link' | 'seo-ai' | 'auth-flow' | 'upgrade-plan';
  relatedSlugs: string[];
}

export const DOC_CATEGORIES = [
  { id: 'getting-started', titleAr: 'البدء والأساسيات', icon: 'Rocket' },
  { id: 'core-services', titleAr: 'الخدمات الأساسية (Portfolio & CV)', icon: 'Layers' },
  { id: 'cases-media', titleAr: 'الحالات السريرية والوسائط', icon: 'Image' },
  { id: 'publishing-seo', titleAr: 'النشر والأرشفة ومحركات الذكاء الاصطناعي', icon: 'Globe' },
  { id: 'account-billing', titleAr: 'الحساب والترقية والدعم', icon: 'ShieldCheck' },
] as const;

export const DOCS_ARTICLES: DocArticle[] = [
  {
    id: 'quickstart',
    slug: 'quickstart',
    category: 'getting-started',
    categoryTitleAr: 'البدء والأساسيات',
    badge: 'أساسي',
    titleAr: 'دليل البدء السريع في PortfolioHubs',
    titleEn: 'Quickstart Guide for Dental Professionals',
    readingTime: '3 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'كل ما تحتاج لمعرفته لبدء حضورك الرقمي الطبي كطبيب أو طالب أسنان واختيار الخدمة المناسبة لحالتك.',
    svgDiagramType: 'quickstart',
    relatedSlugs: ['portfolio-guide', 'cv-guide', 'personal-link'],
    sections: [
      {
        id: 'overview',
        title: 'نظرة عامة على المنصة',
        level: 2,
        content: 'صُممت منصة PortfolioHubs خصيصاً لتلبية احتياجات أطباء وطلبة كليات طب الأسنان في العالم العربي والشرق الأوسط. بدلاً من الاعتماد على مواقع الويب المعقدة ومكلفة الاستضافة، توفر المنصة بنية سريعة، مجانية التكلفة الاستضافية عبر صفحات GitHub Pages الثابتة فائقة السرعة، مع قاعدة بيانات سحابية منظمة بواسطة Firebase Auth و Firestore.'
      },
      {
        id: 'two-services',
        title: 'الخدمتان الأساسيتان للمنصة',
        level: 2,
        content: 'تقدم المنصة خدمتين مستقلتين ومخصصتين بدقة:\n\n1. **بورتفوليو الويب السريري (Dental Web Portfolio):** موقع ويب رسمي متكامل يحمل اسمك الشخصي، يوثق حالاتك السريرية (صور قبل وبعد، الوصف، الفئة)، مهاراتك ومسارك الأكاديمي، ومجهز للتصدر في جوجل ومحركات الذكاء الاصطناعي (ChatGPT & Gemini).\n2. **منشئ السيرة الذاتية الطبية (CV PDF Maker):** أداة مخصصة لتوليد سيرة ذاتية طبية أنيقة بصيغة PDF قياس A4 متوافقة مع متطلبات التقديم للتدريب الصيفي، الامتياز، والوظائف الطبية، مع حفظ فوري ومجاني 100%.'
      },
      {
        id: 'three-steps',
        title: '3 خطوات للبدء الفوري',
        level: 2,
        content: 'للبدء الفوري في غضون 5 دقائق فقط:\n\n1. **سجل دخولك:** أنشئ حساباً باستخدام بريدك الإلكتروني أو حساب جوجل بضغطة زر.\n2. **اختر الخدمة:** اضغط على "بورتفوليو الأسنان" أو "السيرة الذاتية" من الشريط العلوي أو لوحة التحكم.\n3. **املأ معالج الخطوات (Wizard):** يتميز المعالج بحفظ تلقائي فوري لكل حرف تدخله، مع ضغط تلقائي للصور لتوفير استهلاك البيانات وسرعة التصفح.',
        tips: [
          'يمكنك حفظ عملك كمسودة والمتابعة في أي وقت من أي جهاز بفضل المزامنة المحلية والسحابية.',
          'الحد المجاني يتيح لك رفع حتى 3 حالات سريرية كاملة مع استضافة دائمة.'
        ]
      }
    ]
  },
  {
    id: 'personal-link',
    slug: 'personal-link',
    category: 'getting-started',
    categoryTitleAr: 'البدء والأساسيات',
    badge: 'دائم',
    titleAr: 'كيف تحصل على رابطك الشخصي وتشاركه مع المرضى',
    titleEn: 'Getting Your Personal URL & Sharing It',
    readingTime: '4 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'شرح آلية إنشاء عنوان الرابط الفريد (Slug) الخاص بك، وكيفية وضعه في بطاقة عملك وحساباتك المهنية.',
    svgDiagramType: 'personal-link',
    relatedSlugs: ['quickstart', 'seo-ai-ranking', 'approval-workflow'],
    sections: [
      {
        id: 'url-structure',
        title: 'هيكل الرابط الدائم',
        level: 2,
        content: 'يحصل كل طبيب على رابط رسمي فريد بنمط ثابت موثوق وسريع التحميل:\n\n`https://portfoliohubs.github.io/dr[اسمك]/`\n\nأمثلة لأطباء معتمدين:\n- `https://portfoliohubs.github.io/drmichaelnabil/`\n- `https://portfoliohubs.github.io/drhanansakr/`\n- `https://portfoliohubs.github.io/drroaaadel/`\n\nهذا الرابط يعمل على مدار 24 ساعة طوال أيام السنة دون أي تكاليف تجديد سنوية للاستضافة، ومحمي بشهادة أمان SSL عالمية من GitHub.'
      },
      {
        id: 'slug-generation',
        title: 'كيف يتم توليد الـ Slug؟',
        level: 2,
        content: 'يتم استخراج الرابط تلقائياً من اسمك الإنجليزي المدخل في الخطوة الثانية (Personal Info). ننصح بالتالي:\n\n- كتابة الاسم باللغة الإنجليزية بدون ألقاب في حقل الاسم (مثل: Michael Nabil).\n- يضيف النظام تلقائياً بادئة `dr` لإبراز صفتك الطبية.\n- لا تستخدم رموزاً خاصة أو مسافات غير ضرورية لضمان رابط سلس وقصير وسهل التداول.',
        warning: 'بمجرد اعتماد الرابط وأرشفته في محركات البحث، يُفضل عدم تغييره لتفادي فقدان الروابط الخلفية وقوة التصنيف في نتائج بحث جوجل.'
      },
      {
        id: 'smart-sharing',
        title: 'أين تشارك رابطك للحصول على أقصى فائدة؟',
        level: 2,
        content: 'ينصح فريق المنصة بوضع رابطك في المواضع الاستراتيجية التالية:\n\n1. **في Bio حسابك على إنستغرام وتيك توك:** كصفحة هبوط رئيسية يرى فيها المتابعون نتائج الحالات الحقيقية قبل وبعد.\n2. **في بطاقة العمل (Business Card):** مطبوعاً كرمز QR Code مباشر بجانب اسم العيادة.\n3. **في مراسلات الواتساب:** كرابط تعريفي يرسله السكرتير أو مساعد العيادة للمرضى الجدد للإجابة عن تساؤلاتهم حول خبراتك وجودة عملك.'
      }
    ]
  },
  {
    id: 'cv-guide',
    slug: 'cv-guide',
    category: 'core-services',
    categoryTitleAr: 'الخدمات الأساسية',
    titleAr: 'دليل إنشاء السيرة الذاتية الطبية خطوة بخطوة',
    titleEn: 'Step-by-step Dental CV Generator Guide',
    readingTime: '5 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'كيفية كتابة سيرة ذاتية طبية متوافقة مع معايير المستشفيات والتدريب، وتصديرها بصيغة PDF قياسية مجاناً.',
    svgDiagramType: 'cv-flow',
    relatedSlugs: ['quickstart', 'portfolio-guide'],
    sections: [
      {
        id: 'cv-stepper',
        title: 'مراحل بناء السيرة الذاتية',
        level: 2,
        content: 'يعتمد منشئ السيرة الذاتية على معالج Hotmart الرشيق المكون من خطوات واضحة ومتسلسلة:\n\n1. **البيانات الشخصية (Personal):** الاسم بالكامل، المسمى المهني (طبيب امتياز / مقيم / أخصائي)، وسنة التخرج.\n2. **بيانات التواصل (Contact):** رقم الهاتف، الواتساب، البريد الإلكتروني، ورابط بورتفوليوك أو لينكد إن.\n3. **الصورة الشخصية (Photo):** صورة احترافية واضحة يتم قصها وضبطها بنسب متناسقة.\n4. **المهارات السريرية والرقمية (Skills):** إضافة المهارات اليدوية (Endo, Composites, Extractions) والمهارات البرمجية وتصوير الأسنان.\n5. **السجل الأكاديمي (Timeline):** محطات التعليم، التدريب بالمستشفيات الجامعية، والدورات المعتمدة.\n6. **الحالات السريرية (Cases):** خيار تضمين نماذج من أفضل حالاتك المصورة داخل الـ PDF.\n7. **المعاينة والتنزيل (Preview & Download):** معاينة المستند بالكامل وتنزيله بضغطة زر واحدة.'
      },
      {
        id: 'pdf-standards',
        title: 'معايير جودة ملف الـ PDF',
        level: 2,
        content: 'يتم توليد ملف السيرة الذاتية عبر محرك jsPDF عالي الدقة، بخصائص مصممة خصيصاً للقطاع الطبي:\n\n- أبعاد A4 طباعية دقيقة (210 × 297 مم) قابلة للطباعة المباشرة دون تشويه.\n- ألوان طبية أنيقة ترتكز على هوية PortfolioHubs الزرقاء الداكنة الرصينة.\n- توافق كامل مع برامج فحص السير الذاتية (ATS-friendly) في المراكز الطبية الكبرى والمستشفيات الجامعية.'
      }
    ]
  },
  {
    id: 'portfolio-guide',
    slug: 'portfolio-guide',
    category: 'core-services',
    categoryTitleAr: 'الخدمات الأساسية',
    badge: 'شامل',
    titleAr: 'دليل بناء بورتفوليو الويب السريري المعتمد',
    titleEn: 'Step-by-step Dental Web Portfolio Guide',
    readingTime: '6 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'بناء موقعك السريري خطوة بخطوة من المقدمة والبيانات حتى الحالات والعيادة ونظام الحفظ الذكي.',
    svgDiagramType: 'portfolio-flow',
    relatedSlugs: ['cases-and-limits', 'image-quality-compression', 'approval-workflow'],
    sections: [
      {
        id: 'steps-overview',
        title: 'الخطوات السبع للبورتفوليو السريري',
        level: 2,
        content: 'صُمم معالج البورتفوليو (Portfolio Wizard) ليضمن تغطية كل ما يحتاجه المريض وزملاء المهنة:\n\n- **المقدمة (Intro):** توضيح أهمية الموقع الرقمي واستعراض نماذج حية للأطباء المعتمدين.\n- **البيانات الشخصية (Personal):** الاسم باللغتين العربية والإنجليزية، الكلية، واللقب العلمي.\n- **التواصل وموقع العيادة (Contact):** أرقام الهواتف، حسابات التواصل، ورابط خرائط جوجل لتسهيل الوصول للعيادة.\n- **الصورة الشخصية (Photo):** رفع صورة بدقة عالية مع معالجة سريعة.\n- **المهارات السريرية (Skills):** مهارات مقسمة بحسب الاختصاص لتسهيل فرز الحالات.\n- **السجل المهني (Timeline):** محطات التخرج وسنوات التدريب السريري.\n- **الحالات السريرية (Clinical Cases):** رفع صور قبل وبعد ووصف الإجراءات الطبية.'
      },
      {
        id: 'autosave-system',
        title: 'نظام الحفظ التلقائي المقاوم لانقطاع الاتصال',
        level: 2,
        content: 'يحتوي المعالج على نظام حفظ لحظي:\n\n- يتم حفظ كل حرف وصورة محلياً في الذاكرة التخزينية لجهازك (LocalStorage) كلما تنقلت بين الخطوات.\n- إذا أغلقت المتصفح أو انقطع اتصال الإنترنت بالخطأ، ستظهر لك رسالة فورية عند العودة لتأكيد استعادة مسودتك دون فقدان أي بيانات.'
      }
    ]
  },
  {
    id: 'cases-and-limits',
    slug: 'cases-and-limits',
    category: 'cases-media',
    categoryTitleAr: 'الحالات السريرية والوسائط',
    badge: 'الحدود المجانية',
    titleAr: 'رفع الحالات السريرية وحدود الباقة المجانية',
    titleEn: 'Clinical Cases Upload & Free Tier Limits',
    readingTime: '4 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'قواعد رفع الحالات، نظام الـ 3 حالات المجانية، وكيفية تصنيف وعرض صور قبل وبعد باحترافية.',
    svgDiagramType: 'case-limits',
    relatedSlugs: ['image-quality-compression', 'upgrade-faqs'],
    sections: [
      {
        id: 'free-limit-rule',
        title: 'سياسة الحالات المجانية (حتى 3 حالات)',
        level: 2,
        content: 'التزاماً بمبدأ التكلفة الصفرية الدائمة ودعم شباب الأطباء وطلبة الأسنان، تتيح المنصة إضافة حتى **3 حالات سريرية كاملة مجاناً مدى الحياة**.\n\nتشمل كل حالة:\n- صورة قبل (Before Photo) عالية الوضوح.\n- صورة بعد (After Photo) بالنتيجة النهائية.\n- عنوان الحالة بالإنجليزية والعربية لتسهيل فهم المرضى والزملاء.\n- تصنيف تخصصي (حشوات تجميلية، علاج جذور، تركيبات، زراعة، إلخ).'
      },
      {
        id: 'subcollections-architecture',
        title: 'معمارية Subcollections المتقدمة',
        level: 2,
        content: 'لحماية استقرار حسابك وسرعته، لا تُخزن الحالات في وثيقة واحدة كـ Base64 (مما كان يسبب تجاوز حد الـ 1MB لـ Firestore سابقاً). بدلاً من ذلك، تُحفظ كل حالة كوثيقة منفصلة في مجموعة فرعية (Subcollection) برقم ترتيب مستقل، مما يضمن تحميل الحالات بسرعة وسلاسة متناهية.'
      },
      {
        id: 'reaching-limit',
        title: 'ماذا يحدث عند تجاوز الحد المجاني؟',
        level: 2,
        content: 'عند محاولة إضافة الحالة الرابعة على الحساب المجاني، يظهر نافذة تنبيه ذكية توضح أنك وصلت للحد الأقصى، مع زر مباشر للمراسلة عبر واتساب لترقية الحساب وزيادة عدد الحالات إلى باقات غير محدودة بطلب كود تفعيل فوري.'
      }
    ]
  },
  {
    id: 'image-quality-compression',
    slug: 'image-quality-compression',
    category: 'cases-media',
    categoryTitleAr: 'الحالات السريرية والوسائط',
    titleAr: 'جودة الصور السريرية وضغطها ومعمارية التخزين',
    titleEn: 'Clinical Image Quality, Compression & Storage Architecture',
    readingTime: '5 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'كيف تضمن المنصة سرعة تحميل فائقة لصور الأسنان الدقيقة عبر المعالجة المحلية قبل الرفع والتخزين الفعلي.',
    svgDiagramType: 'image-pipeline',
    relatedSlugs: ['cases-and-limits', 'approval-workflow'],
    sections: [
      {
        id: 'client-compression',
        title: 'الضغط المحلي في متصفح الطبيب',
        level: 2,
        content: 'تستخدم المنصة خوارزمية ضغط صور متقدمة تعمل مباشرة داخل جهازك (Client-side HTML5 Canvas Compression):\n\n- تقليل حجم الصورة من 10 ميجابايت إلى أقل من 250 كيلوبايت دون التأثير على التباين السريري لخطوط الابتسامة وحواف الترميمات.\n- الحفاظ على تفاصيل الظلال ونقاء اللون العاجي وملمس اللثة.\n- حماية باقة بيانات الهاتف المحمول للطبيب أثناء الرفع في العيادة.'
      },
      {
        id: 'zero-storage-cost',
        title: 'التخزين الحقيقي في المستودع بدلاً من Firestore Base64',
        level: 2,
        content: 'تم اعتماد قرار معماري هندسي حاسم:\n\n**ممنوع تخزين الصور كـ base64 داخل وثائق Firestore:** كان ذلك سبب امتلائها من حالة واحدة نتيجة حد الـ 1MB للوثيقة الواحدة.\n\nتُودع الصور كملفات حقيقية ومضغوطة داخل مستودع المشروع ويتم تقديمها عبر شبكة التوزيع العالمية لـ GitHub Pages CDN، محققة:\n1. تكلفة صفرية مستدامة للأبد دون أي اشتراكات سحابية مدفوعة.\n2. سرعة تحميل فورية للمرضى حتى في اتصالات الجيل الثالث والرابع الضعيفة.'
      },
      {
        id: 'photography-tips',
        title: 'نصائح لتصوير سريري ممتاز',
        level: 2,
        content: 'للحصول على أفضل مظهر لحالاتك في البورتفوليو:\n- استخدم عاكس الضوء الفموي ومباعد الخد (Cheek retractor) لتوسيع الرؤية.\n- جفف الأسنان بلطف بالهواء قبل التقاط صور الكومبوزيت لإبراز الملمس السطحي.\n- حافظ على زاوية 90 درجة مع السطح الإطباقي أو الشفوي.'
      }
    ]
  },
  {
    id: 'approval-workflow',
    slug: 'approval-workflow',
    category: 'publishing-seo',
    categoryTitleAr: 'النشر والأرشفة ومحركات الذكاء الاصطناعي',
    titleAr: 'دورة الاعتماد والنشر إلى صفحات GitHub Pages الثابتة',
    titleEn: 'Approval & Static Publication Workflow to GitHub Pages',
    readingTime: '5 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'كيف تتحول بياناتك وحالاتك إلى صفحات HTML ثابتة حقيقية ومفهرسة عبر مسارات GitHub Actions الآلية.',
    svgDiagramType: 'deploy-flow',
    relatedSlugs: ['personal-link', 'seo-ai-ranking'],
    sections: [
      {
        id: 'static-vs-dynamic',
        title: 'لماذا صفحات HTML ثابتة بدلاً من الجافاسكريبت الديناميكي؟',
        level: 2,
        content: 'هذا هو السبب الجذري للتميز في PortfolioHubs:\n\nعندما تكون الصفحة مجرد جافاسكريبت تُبنى من قاعدة البيانات لحظة الزيارة، تعجز عناكب محركات البحث وتطبيقات المراسلة عن قراءة محتواها وتأخذ وقتاً طويلاً في التحميل.\n\nبينما تُنشئ PortfolioHubs **ملف HTML ثابت حقيقي لكل طبيب** مودع في المستودع، مما يضمن:\n- تحميل فوري بزمن أقل من ثانية واحدة (100/100 على Google PageSpeed).\n- ظهور صورة الطبيب وعنوانه مباشرة عند إرسال الرابط في واتساب وفيسبوك.\n- أرشفة سريعة في جوجل خلال 3 أيام إلى أسبوع واحد فقط.'
      },
      {
        id: 'github-actions-pipeline',
        title: 'مسار سير العمل الآلي (GitHub Actions)',
        level: 2,
        content: 'عند اعتماد وتحديث ملفك من لوحة الإدارة أو حفظه، ينطلق مسار العمل الآلي:\n\n1. قراءة البيانات وحالات الطبيب من Firestore.\n2. حقن وسوم الميتا المهنية، والبيانات المنظمة (JSON-LD)، ومحتوى الحالات داخل قالب HTML الطبيب.\n3. حفظ وتوليد الملف في مسار المستودع `portfoliohubs.github.io/dr[name]/index.html`.\n4. نشر فوري ومباشر إلى الإنترنت عالمياً.'
      }
    ]
  },
  {
    id: 'seo-ai-ranking',
    slug: 'seo-ai-ranking',
    category: 'publishing-seo',
    categoryTitleAr: 'النشر والأرشفة ومحركات الذكاء الاصطناعي',
    badge: 'ذكاء اصطناعي',
    titleAr: 'تحسين ظهورك في جوجل وإجابات ChatGPT و Gemini',
    titleEn: 'SEO, Google Indexing & AI Engine Answer Discovery',
    readingTime: '6 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'شرح معمارية الـ Schema والبيانات المنظمة التي تجعل اسمك وعيادتك يظهران في نتائج البحث وتطبيقات الذكاء الاصطناعي.',
    svgDiagramType: 'seo-ai',
    relatedSlugs: ['personal-link', 'approval-workflow'],
    sections: [
      {
        id: 'schema-org',
        title: 'هيكل Schema.org الطبي (DentalClinic & Dentist)',
        level: 2,
        content: 'تحتوي كل صفحة بورتفوليو على كود بيانات منظمة دقيق يفهمه محرك بحث جوجل ونماذج الذكاء الاصطناعي التوليدي:\n\n- نوع الكيان: `Dentist` و `MedicalBusiness`.\n- الاسم الجغرافي للعيادة وموقعها على الخريطة.\n- المهارات السريرية وأيام وساعات العمل وأرقام الهاتف.\n- قائمة الحالات السريرية وصورها المصغرة.',
        codeSnippet: {
          language: 'json',
          code: `{\n  "@context": "https://schema.org",\n  "@type": "Dentist",\n  "name": "Dr. Your Name",\n  "medicalSpecialty": "Dentistry",\n  "telephone": "+201234567890",\n  "url": "https://portfoliohubs.github.io/dryourname/"\n}`
        }
      },
      {
        id: 'ai-discovery',
        title: 'كيف تظهر في إجابات ChatGPT و Gemini؟',
        level: 2,
        content: 'عندما يسأل المريض ChatGPT أو Gemini:\n\n*"أريد طبيب أسنان ممتاز في المعادي لتركيبات الزيركونيا"*،\n\nتقوم محركات البحث المعززة بالذكاء الاصطناعي بتمشيط الصفحات الثابتة التي تحتوي على نصوص سريرية واضحة وبيانات منظمة وموثوقة على نطاق github.io ذي الموثوقية العالية (Domain Authority)، فيظهر اسمك ورابط موقعك كإجابة موثوقة مقترحة.'
      },
      {
        id: 'ranking-tips',
        title: '3 نصائح لتسريع تصدر اسمك',
        level: 2,
        content: '1. **اكتب اسمك الثلاثي بدقة:** بالعربية والإنجليزية كما يعرفك المرضى.\n2. **صف الحالات بكلمات يبحث عنها المريض:** مثل "تبييض الأسنان بالليزر" أو "علاج عصب الضرس بدون ألم".\n3. **ضع رابط عيادتك على خرائط جوجل:** لربط التقييمات الجغرافية بصفحة البورتفوليو.'
      }
    ]
  },
  {
    id: 'auth-troubleshooting',
    slug: 'auth-troubleshooting',
    category: 'account-billing',
    categoryTitleAr: 'الحساب والترقية والدعم',
    titleAr: 'حل المشاكل الشائعة لتسجيل الدخول والمصادقة',
    titleEn: 'Troubleshooting Login & Firebase Authentication',
    readingTime: '4 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'حلول سريعة لمشاكل استعادة كلمة المرور، حظر النوافذ المنبثقة، وتغيير الحساب.',
    svgDiagramType: 'auth-flow',
    relatedSlugs: ['quickstart', 'upgrade-faqs'],
    sections: [
      {
        id: 'popup-blocked',
        title: 'مشكلة حظر تسجيل الدخول بجوجل (Popups Blocked)',
        level: 2,
        content: 'إذا ضغطت على "تسجيل الدخول باستخدام جوجل" ولم يفتح الحساب:\n\n- تأكد من أن متصفح الهاتف أو الكمبيوتر (خاصة سفاري أو كروم في وضع التصفح الخفي) لا يحظر النوافذ المنبثقة (Pop-ups).\n- اضغط على أيقونة القفل أو الإعدادات في شريط العنوان واسمح بالنوافذ المنبثقة لـ `portfoliohubs.github.io` أو نطاق المنصة الحالي.'
      },
      {
        id: 'reset-password',
        title: 'نسيان كلمة المرور واستعادتها',
        level: 2,
        content: 'يمكنك استعادة كلمة المرور في أي وقت:\n1. توجه لصفحة تسجيل الدخول واضغط على "نسيت كلمة المرور؟".\n2. أدخل بريدك الإلكتروني المسجل واضغط "إرسال رابط الاستعادة".\n3. تفقد مجلد البريد الوارد (Inbox) أو البريد غير المرغوب فيه (Spam / Junk) واضغط على الرابط لإعادة تعيين كلمة المرور فوراً.'
      },
      {
        id: 'session-persistence',
        title: 'البقاء مسجلاً في جهاز العيادة',
        level: 2,
        content: 'تستخدم المنصة ميزة استمرار الجلسة الآمنة (Local Persistence) في Firebase Auth، مما يعني أنك لن تحتاج لإعادة إدخال كلمة المرور في كل مرة تفتح فيها متصفح العيادة، مع إمكانية تسجيل الخروج بضغطة زر لحماية خصوصية بياناتك.'
      }
    ]
  },
  {
    id: 'upgrade-faqs',
    slug: 'upgrade-faqs',
    category: 'account-billing',
    categoryTitleAr: 'الحساب والترقية والدعم',
    badge: 'ترقية',
    titleAr: 'الأسئلة الشائعة عن الترقية وطلب الباقة المميزة',
    titleEn: 'Upgrade FAQs & Premium Activation via WhatsApp',
    readingTime: '4 دقائق',
    lastUpdated: 'سبتمبر 2026',
    summaryAr: 'كل ما تحتاج لمعرفته عن باقة البورتفوليو غير المحدود وتفعيلها المباشر عبر واتساب.',
    svgDiagramType: 'upgrade-plan',
    relatedSlugs: ['cases-and-limits', 'personal-link', 'seo-ai-ranking'],
    sections: [
      {
        id: 'why-upgrade',
        title: 'ما هي مميزات الترقية للباقة الاحترافية؟',
        level: 2,
        content: 'تمنحك الترقية الاحترافية لبورتفوليو الأسنان مميزات دائمة تشمل:\n\n- رفع عدد غير محدود من الحالات السريرية المصنفة.\n- تصدر مميز في نتائج محركات البحث والإجابات الذكية.\n- إمكانية ربط دومين خاص (Custom Domain مثل: `drname.com`) دون تكاليف استضافة إضافية.\n- دعم فني طبي مباشر وتعديل فوري للتفاصيل.'
      },
      {
        id: 'how-to-activate',
        title: 'كيف يتم التفعيل والدفع؟',
        level: 2,
        content: 'يتم التفعيل في خطوات بسيطة ومباشرة:\n\n1. اضغط على زر "ترقية الحساب" في لوحة التحكم أو عند وصولك لحد الـ 3 حالات.\n2. ينقلك الزر تلقائياً إلى محادثة واتساب المعتمدة للمنصة: `wa.me/201271476215`.\n3. تتضمن الرسالة اسمك المسجل تلقائياً لتسهيل المتابعة.\n4. يدعم الدفع جميع الوسائل المتاحة (فودافون كاش، محافظ إلكترونية، تحويل بنكي، إنستاباي، وبطاقات الدفع).'
      },
      {
        id: 'duration-and-renewal',
        title: 'هل هناك اشتراك شهري متكرر؟',
        level: 2,
        content: 'لا! تؤمن منصة PortfolioHubs بالدعم الحقيقي لأطباء الأسنان، لذا فالباقات الأساسية تُقدم كرسوم إعداد لمرة واحدة دون أي مصاريف استضافة شهرية، لأن استضافتك مستقرة ودائمة على البنية التحتية العالمية.'
      }
    ]
  }
];

export function getDocArticleBySlug(slug: string): DocArticle | undefined {
  return DOCS_ARTICLES.find(a => a.slug === slug || a.id === slug);
}
