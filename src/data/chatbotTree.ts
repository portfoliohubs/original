export interface SuggestedAction {
  labelAr: string;
  actionType: 'navigate' | 'query' | 'whatsapp' | 'doc';
  payload: string; // URL, question text, or doc slug
}

export interface ChatbotNode {
  id: string;
  routePattern?: string; // e.g. '/portfolio', '/cv', '/dashboard', '/docs'
  stepPattern?: string;  // e.g. 'cases', 'personal', 'photo', 'skills'
  keywords: string[];
  titleAr: string;
  responseAr: string;
  docSlug?: string;
  suggestedActions: SuggestedAction[];
}

export interface DecisionTree {
  contextualNodes: ChatbotNode[];
  generalNodes: ChatbotNode[];
  fallback: {
    messageAr: string;
    whatsappNumber: string;
  };
}

export const CHATBOT_DECISION_TREE: DecisionTree = {
  // 1. Contextual Nodes (triggered proactively on modal open based on active route and step)
  contextualNodes: [
    {
      id: 'ctx-portfolio-intro',
      routePattern: '/portfolio',
      stepPattern: 'intro',
      keywords: ['intro', 'مقدمة', 'بداية', 'بورتفوليو', 'start'],
      titleAr: 'مساعد خطوة المقدمة ونماذج الأطباء',
      responseAr: 'أهلاً دكتور! أنت الآن في خطوة البداية لاستعراض مميزات بورتفوليو الويب السريري. يمكنك استكشاف نماذج الأطباء المعتمدين لرؤية كيف سيبدو موقعك برابطه الرسمي. كل ما تدخله بعد الضغط على "ابدأ الآن" يُحفظ تلقائياً.',
      docSlug: 'portfolio-guide',
      suggestedActions: [
        { labelAr: 'دليل البورتفوليو خطوة بخطوة', actionType: 'doc', payload: 'portfolio-guide' },
        { labelAr: 'كيف يعمل الرابط الدائم؟', actionType: 'doc', payload: 'personal-link' },
      ]
    },
    {
      id: 'ctx-portfolio-personal',
      routePattern: '/portfolio',
      stepPattern: 'personal',
      keywords: ['personal', 'اسم', 'شخصي', 'رابط'],
      titleAr: 'مساعد البيانات الشخصية',
      responseAr: 'دكتور، احرص في هذه الخطوة على كتابة اسمك بالإنجليزية بدقة كما تحب أن يظهر (مثلاً: Michael Nabil)، حيث يستخدمه النظام لتوليد رابطك الرسمي المباشر portfoliohubs.github.io/dr[name]. كما يُفضل كتابة الجامعة وسنة التخرج لتوثيق مسارك.',
      docSlug: 'personal-link',
      suggestedActions: [
        { labelAr: 'كيف يعمل الرابط الشخصي؟', actionType: 'doc', payload: 'personal-link' },
        { labelAr: 'أهمية كتابة الاسم بدقة', actionType: 'query', payload: 'كيف يتم توليد الرابط من اسمي؟' },
      ]
    },
    {
      id: 'ctx-portfolio-contact',
      routePattern: '/portfolio',
      stepPattern: 'contact',
      keywords: ['contact', 'عيادة', 'تواصل', 'واتساب', 'خريطة'],
      titleAr: 'مساعد بيانات التواصل والعيادة',
      responseAr: 'إضافة رقم الواتساب ورابط موقع عيادتك على خرائط جوجل يرفع معدل تواصل المرضى بنسبة 80%. يتضمن بورتفوليوك أزرار اتصال ومراسلة سريعة ترتبط مباشرة برقمك.',
      docSlug: 'seo-ai-ranking',
      suggestedActions: [
        { labelAr: 'أهمية خرائط جوجل للسيو', actionType: 'doc', payload: 'seo-ai-ranking' },
        { labelAr: 'تعديل بيانات التواصل', actionType: 'query', payload: 'كيف أعدل بيانات عيادتي لاحقاً؟' },
      ]
    },
    {
      id: 'ctx-portfolio-photo',
      routePattern: '/portfolio',
      stepPattern: 'photo',
      keywords: ['photo', 'صورة', 'بروفايل', 'خلفية'],
      titleAr: 'مساعد الصورة الشخصية',
      responseAr: 'ننصح في خطوة الصورة الشخصية باختيار صورة رسمية بخلفية محايدة (بيضاء أو رمادية) أو داخل العيادة بالزي الطبي (Scrub). يقوم نظامنا تلقائياً بقصها بنسبة 1:1 وضغطها لتظهر بوضوح فائق على الجوال والكمبيوتر.',
      docSlug: 'image-quality-compression',
      suggestedActions: [
        { labelAr: 'نصائح التصوير الطبي', actionType: 'doc', payload: 'image-quality-compression' },
        { labelAr: 'حل مشاكل رفع الصورة', actionType: 'query', payload: 'الصورة الشخصية لا تُرفع' },
      ]
    },
    {
      id: 'ctx-portfolio-skills',
      routePattern: '/portfolio',
      stepPattern: 'skills',
      keywords: ['skills', 'مهارات', 'تخصص', 'endo', 'implants'],
      titleAr: 'مساعد المهارات السريرية',
      responseAr: 'أضف مجالات تميزك مثل: Endodontics, Aesthetic Composites, Dental Photography, Fixed Prosthodontics. تصنيف المهارات يساعد محركات البحث والذكاء الاصطناعي في ربط اسمك بالحالات المطلوبة.',
      docSlug: 'seo-ai-ranking',
      suggestedActions: [
        { labelAr: 'الظهور في إجابات AI', actionType: 'doc', payload: 'seo-ai-ranking' },
      ]
    },
    {
      id: 'ctx-portfolio-timeline',
      routePattern: '/portfolio',
      stepPattern: 'timeline',
      keywords: ['timeline', 'مسار', 'تعليم', 'تخرج'],
      titleAr: 'مساعد السجل الأكاديمي والمهني',
      responseAr: 'هنا تسرد محطاتك المهمة: سنة التخرج من كلية طب الأسنان، فترة الامتياز، الدورات المعتمدة، أو التحضير للماجستير والزمالة. يتم عرضها بأسلوب زمني تفاعلي أنيق.',
      docSlug: 'portfolio-guide',
      suggestedActions: [
        { labelAr: 'دليل البورتفوليو الكامل', actionType: 'doc', payload: 'portfolio-guide' },
      ]
    },
    {
      id: 'ctx-portfolio-cases',
      routePattern: '/portfolio',
      stepPattern: 'cases',
      keywords: ['cases', 'clinical', 'حالات', 'رفع', 'صور', 'قبل وبعد'],
      titleAr: 'مساعد خطوة الحالات السريرية',
      responseAr: 'أهلاً دكتور! أراك في خطوة رفع الحالات السريرية. تتيح لك الباقة المجانية حتى 3 حالات بدقة فائقة. يتم ضغط صورك تلقائياً داخل المتصفح للحفاظ على وضوح التفاصيل دون إبطاء الموقع. هل تحتاج مساعدة في رفع صور Before & After أو ترقية الباقة لحالات غير محدودة؟',
      docSlug: 'cases-and-limits',
      suggestedActions: [
        { labelAr: 'قواعد حد الـ 3 حالات', actionType: 'query', payload: 'ما هي حدود الحالات المجانية؟' },
        { labelAr: 'جودة وضغط الصور', actionType: 'doc', payload: 'image-quality-compression' },
        { labelAr: 'ترقية الحساب عبر واتساب', actionType: 'whatsapp', payload: 'طلب ترقية الحالات لحساب غير محدود' },
      ]
    },
    {
      id: 'ctx-cv-preview',
      routePattern: '/cv',
      stepPattern: 'preview',
      keywords: ['preview', 'تنزيل', 'تحميل', 'pdf', 'طباعة'],
      titleAr: 'مساعد معاينة وتنزيل الـ CV',
      responseAr: 'وصلت للخطوة الأخيرة دكتور! يمكنك الآن مراجعة بياناتك وتنزيل ملف الـ PDF فوراً بصيغة طباعية قياسية A4 معتمدة للمستشفيات والتدريب الصيفي. التنزيل مجاني بالكامل وبدون أي قيود.',
      docSlug: 'cv-guide',
      suggestedActions: [
        { labelAr: 'معايير جودة ملف الـ PDF', actionType: 'doc', payload: 'cv-guide' },
        { labelAr: 'بناء بورتفوليو ويب سريري', actionType: 'navigate', payload: '/portfolio' }
      ]
    },
    {
      id: 'ctx-cv',
      routePattern: '/cv',
      keywords: ['cv', 'سيرة ذاتية', 'pdf', 'تنزيل'],
      titleAr: 'مساعد السيرة الذاتية (CV Maker)',
      responseAr: 'أهلاً بك في منشئ السيرة الذاتية الطبية! الأداة مجانية 100% ومصممة بمقاس A4 طباعي معتمد للمستشفيات والتدريب الصيفي. يمكنك ملء الأقسام وتصدير الـ PDF فوراً بدون أي رسوم.',
      docSlug: 'cv-guide',
      suggestedActions: [
        { labelAr: 'خطوات إنشاء الـ CV', actionType: 'doc', payload: 'cv-guide' },
        { labelAr: 'تضمين الحالات في الـ PDF', actionType: 'query', payload: 'هل يمكن وضع صور الحالات في الـ CV؟' },
      ]
    },
    {
      id: 'ctx-dashboard',
      routePattern: '/dashboard',
      keywords: ['dashboard', 'لوحة', 'حسابي', 'تعديل'],
      titleAr: 'مساعد لوحة التحكم',
      responseAr: 'مرحباً دكتور في لوحة تحكم حسابك! يمكنك هنا متابعة حالاتك المحفوظة، مراجعة رابط بورتفوليوك، تعديل بياناتك في أي وقت، أو الترقية لحالات غير محدودة.',
      docSlug: 'approval-workflow',
      suggestedActions: [
        { labelAr: 'دورة النشر والاعتماد', actionType: 'doc', payload: 'approval-workflow' },
        { labelAr: 'مشاركة الرابط الشخصي', actionType: 'doc', payload: 'personal-link' },
        { labelAr: 'طلب ترقية الحساب', actionType: 'whatsapp', payload: 'أريد ترقية حسابي من لوحة التحكم' },
      ]
    },
    {
      id: 'ctx-docs',
      routePattern: '/docs',
      keywords: ['docs', 'توثيق', 'دليل', 'شرح'],
      titleAr: 'مساعد مركز التوثيق',
      responseAr: 'أنت الآن في مركز التوثيق الشامل لـ PortfolioHubs. يمكنك استخدام البحث الفوري السريع (⌘K) أو تصفح الأقسام الجانبية للتعرف على جميع أسرار المنصة والسيو.',
      docSlug: 'quickstart',
      suggestedActions: [
        { labelAr: 'دليل البدء السريع', actionType: 'doc', payload: 'quickstart' },
        { labelAr: 'الظهور في محركات الذكاء الاصطناعي', actionType: 'doc', payload: 'seo-ai-ranking' },
      ]
    },
    {
      id: 'ctx-login',
      routePattern: '/login',
      keywords: ['login', 'دخول', 'تسجيل', 'باسورد'],
      titleAr: 'مساعد تسجيل الدخول',
      responseAr: 'هل تواجه صعوبة في الدخول؟ تأكد من السماح بالنوافذ المنبثقة عند استخدام حساب جوجل، أو استخدم ميزة "نسيت كلمة المرور" لاستلام رابط إعادة التعيين.',
      docSlug: 'auth-troubleshooting',
      suggestedActions: [
        { labelAr: 'حل مشاكل تسجيل الدخول', actionType: 'doc', payload: 'auth-troubleshooting' },
      ]
    }
  ],

  // 2. General Knowledge Nodes (matched via free text keywords)
  generalNodes: [
    {
      id: 'node-case-limits',
      keywords: ['حد', 'حدود', '3 حالات', 'كم حالة', 'حالات مجانية', 'limit', 'free cases', 'max cases', 'حالات إضافية'],
      titleAr: 'حدود الحالات السريرية المجانية',
      responseAr: 'تتيح منصة PortfolioHubs لكل طبيب إضافة حتى 3 حالات سريرية كاملة (صور قبل وبعد، العنوان، التصنيف والوصف) مجاناً للأبد. عند الرغبة في إضافة حالات غير محدودة وتوثيق كامل مسيرتك، يمكنك الترقية بضغطة زر عبر واتساب.',
      docSlug: 'cases-and-limits',
      suggestedActions: [
        { labelAr: 'قراءة دليل الحالات والحدود', actionType: 'doc', payload: 'cases-and-limits' },
        { labelAr: 'ترقية الحالات غير المحدودة', actionType: 'whatsapp', payload: 'أرغب في ترقية باقة الحالات إلى غير محدودة' }
      ]
    },
    {
      id: 'node-image-compression',
      keywords: ['صور', 'رفع الصور', 'حجم الصورة', 'ضغط', 'webp', 'canvas', 'image', 'photo', 'upload', 'mb', 'kb', 'مشكلة رفع'],
      titleAr: 'ضغط وجودة الصور السريرية',
      responseAr: 'يتم ضغط صور الأسنان محلياً داخل المتصفح تلقائياً من 10MB إلى ~180KB مع الحفاظ بنسبة 100% على تباين خطوط الأسنان والترميمات. هذا يمنع امتلاء قاعدة البيانات ويضمن تحميل موقعك في أجزاء من الثانية.',
      docSlug: 'image-quality-compression',
      suggestedActions: [
        { labelAr: 'تفاصيل معمارية الصور', actionType: 'doc', payload: 'image-quality-compression' }
      ]
    },
    {
      id: 'node-personal-link',
      keywords: ['رابط', 'لينك', 'slug', 'url', 'link', 'عنوان', 'رابطي', 'موقعي', 'دومين', 'domain'],
      titleAr: 'الرابط الشخصي ومشاركته',
      responseAr: 'يحصل كل طبيب على رابط رسمي ثابت بصيغة: https://portfoliohubs.github.io/dr[name]/ وهو مستضاف مجاناً مدى الحياة على شبكة خوادم GitHub Pages فائقة السرعة ومحمي بشهادة أمان SSL.',
      docSlug: 'personal-link',
      suggestedActions: [
        { labelAr: 'دليل مشاركة واستخدام الرابط', actionType: 'doc', payload: 'personal-link' }
      ]
    },
    {
      id: 'node-seo-google-ai',
      keywords: ['جوجل', 'سيو', 'seo', 'google', 'chatgpt', 'gemini', 'ذكاء اصطناعي', 'أرشفة', 'search', 'ranking', 'ظهور'],
      titleAr: 'الأرشفة وتصدر إجابات الذكاء الاصطناعي',
      responseAr: 'تحتوي صفحات الأطباء على أكواد Schema.org الطبية المعتمدة (Dentist & DentalClinic)، مما يمكّن محرك بحث جوجل ونماذج مثل ChatGPT و Gemini من قراءة بياناتك وترشيحك للمرضى كطبيب معتمد.',
      docSlug: 'seo-ai-ranking',
      suggestedActions: [
        { labelAr: 'شرح معمارية الـ SEO والـ AI', actionType: 'doc', payload: 'seo-ai-ranking' }
      ]
    },
    {
      id: 'node-upgrade-pricing',
      keywords: ['ترقية', 'سعر', 'تكلفة', 'فلوس', 'شراء', 'upgrade', 'price', 'cost', 'pay', 'hotmart', 'باقة', 'اشتراك'],
      titleAr: 'أسعار وباقات الترقية',
      responseAr: 'الخدمات الأساسية واستضافة الـ 3 حالات والسيرة الذاتية مجانية بالكامل. تتوفر باقة الترقية لحالات غير محدودة ودعم مخصص برسم إعداد رمزي لمرة واحدة (بدون اشتراك شهري متكرر). التفعيل فوري عبر واتساب.',
      docSlug: 'upgrade-faqs',
      suggestedActions: [
        { labelAr: 'مراسلة الدعم للترقية الفورية', actionType: 'whatsapp', payload: 'أريد معرفة تفاصيل ترقية الباقة الاحترافية' },
        { labelAr: 'الأسئلة الشائعة عن الترقية', actionType: 'doc', payload: 'upgrade-faqs' }
      ]
    },
    {
      id: 'node-cv-pdf',
      keywords: ['سيرة', 'سيره', 'cv', 'pdf', 'تحميل', 'تنزيل', 'طباعة', 'resume', 'امتياز', 'تدريب'],
      titleAr: 'منشئ السيرة الذاتية الطبية',
      responseAr: 'أداة الـ CV Maker مجانية 100% ولا تتطلب أي دفع. تُولد مستند PDF أنيق بمقاس A4 عالمي مطابق لمعايير المستشفيات والمراكز الأكاديمية.',
      docSlug: 'cv-guide',
      suggestedActions: [
        { labelAr: 'دليل إنشاء السيرة الذاتية', actionType: 'doc', payload: 'cv-guide' },
        { labelAr: 'الذهاب لمنشئ السيرة الذاتية', actionType: 'navigate', payload: '/cv' }
      ]
    },
    {
      id: 'node-autosave',
      keywords: ['حفظ', 'مسودة', 'ضياع', 'فقدان', 'save', 'draft', 'autosave', 'انقطاع'],
      titleAr: 'نظام الحفظ التلقائي',
      responseAr: 'يتم حفظ كل خطوة وبيان تدخله محلياً وسحابياً فور إدخاله، حتى إذا أغلق المتصفح أو انقطع الاتصال، ستستعيد عملك بالكامل بمجرد العودة.',
      docSlug: 'portfolio-guide',
      suggestedActions: [
        { labelAr: 'العودة لمتابعة البورتفوليو', actionType: 'navigate', payload: '/portfolio' }
      ]
    },
    {
      id: 'node-login-auth',
      keywords: ['تسجيل', 'دخول', 'باسورد', 'كلمة مرور', 'إيميل', 'login', 'password', 'reset', 'استعادة', 'حساب'],
      titleAr: 'المصادقة وتسجيل الدخول',
      responseAr: 'يمكنك استخدام بريدك الإلكتروني أو حساب جوجل. إذا واجهت مشكلة في الدخول، تأكد من إلغاء حظر النوافذ المنبثقة أو اضغط "نسيت كلمة المرور" لاستلام رابط فوري لإعادة التعيين.',
      docSlug: 'auth-troubleshooting',
      suggestedActions: [
        { labelAr: 'حل مشاكل الدخول', actionType: 'doc', payload: 'auth-troubleshooting' }
      ]
    }
  ],

  // 3. Fallback when no keyword matches
  fallback: {
    messageAr: 'لم أستطع العثور على إجابة دقيقة لسؤالك في قاعدة المعرفة المدمجة. فريق الدعم الفني الطبي متواجد دائماً لمساعدتك عبر واتساب مباشرة:',
    whatsappNumber: '201271476215'
  }
};
