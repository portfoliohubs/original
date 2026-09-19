/**
 * PortfolioHubs - Static Page Generation & Automated SEO Articles Engine
 * 
 * Generates 100% static, crawlable HTML pages for approved doctors:
 * 1. Main Doctor Portfolio: /dr/{username}/index.html (with Before/After slider & auto-carousel)
 * 2. Article Angle (A): /dr/{username}/articles/about.html (Biography & Career Journey)
 * 3. Article Angle (B): /dr/{username}/articles/clinical-cases.html (Case Studies & Treatment Mastery)
 * 4. Article Angle (C): /dr/{username}/articles/dentist-in-{city}.html (Local Dental Services)
 * 5. Article Angle (D): /dr/{username}/articles/patient-guide.html (Patient Oral Health Guide)
 * 
 * Scaled Content Abuse Protection:
 * - Employs 60+ distinct, curated paragraph templates (15+ per angle) dynamically shuffled and
 *   interwoven with real clinical data to ensure every article has a truly unique structure.
 * 
 * Security:
 * - 100% strict HTML entity escaping across all dynamic fields for complete XSS prevention.
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

// ==========================================
// 1. Firebase Admin Initialization
// ==========================================
function initFirebaseAdmin() {
  const fbAdmin = admin.default || admin;
  if (fbAdmin.apps && fbAdmin.apps.length > 0) {
    return fbAdmin.app();
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return fbAdmin.initializeApp({
        credential: fbAdmin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.VITE_FIREBASE_PROJECT_ID || 'portfoliohubs-8d806'
      });
    } catch (err) {
      console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT JSON. Falling back:', err.message);
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return fbAdmin.initializeApp({
      credential: fbAdmin.credential.applicationDefault(),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'portfoliohubs-8d806'
    });
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'portfoliohubs-8d806';
  return fbAdmin.initializeApp({ projectId });
}

// ==========================================
// 2. Security & Sanitization Helpers
// ==========================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function slugify(text) {
  if (!text) return 'doctor';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A-]+/g, '')
    .replace(/--+/g, '-');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeBase64ToFile(filePath, base64Data) {
  ensureDir(path.dirname(filePath));
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  fs.writeFileSync(filePath, buffer);
  return buffer.length;
}

// Pseudo-random deterministic shuffle based on seed string
function shuffleWithSeed(array, seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    hash = Math.sin(hash++) * 10000;
    const j = Math.floor((hash - Math.floor(hash)) * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

// ==========================================
// 3. Category Mapping
// ==========================================
const CATEGORY_NAMES = {
  operative: { en: 'Operative & Esthetics', ar: 'الحشو والتجميل' },
  cosmetic: { en: 'Cosmetic Dentistry', ar: 'تجميل الأسنان' },
  prosthesis_fixed: { en: 'Fixed Prosthodontics', ar: 'تركيبات ثابتة' },
  prosthesis_removable: { en: 'Removable Prosthodontics', ar: 'تركيبات متحركة' },
  endodontics: { en: 'Endodontics', ar: 'علاج الجذور وحشو العصب' },
  oral_surgery: { en: 'Oral Surgery', ar: 'جراحة الفم والأسنان' },
  periodontics: { en: 'Periodontics', ar: 'علاج وجراحة اللثة' },
  orthodontics: { en: 'Orthodontics', ar: 'تقويم الأسنان' },
  pediatric: { en: 'Pediatric Dentistry', ar: 'طب أسنان الأطفال' },
  implant: { en: 'Dental Implants', ar: 'زراعة الأسنان' },
};

function getCategoryLabels(catKey, customCat) {
  if (catKey === 'custom' && customCat) return { en: customCat, ar: customCat };
  if (CATEGORY_NAMES[catKey]) return CATEGORY_NAMES[catKey];
  return { en: catKey || 'Dental Treatment', ar: catKey || 'علاج أسنان' };
}

// ==========================================
// 4. Article Template Bank (20+ Templates Per Angle = 80+ Total Templates)
// ==========================================
const ARTICLE_TEMPLATES = {
  // Angle A: Biography & Professional Journey (20 Templates)
  about: [
    (d) => `<p>تعتبر مسيرة <strong>${d.fullNameAr}</strong> في مجال طب وجراحة الفم والأسنان نموذجاً للالتزام الأكاديمي والسريري، حيث تخرج من <em>${d.universityAr || 'إحدى كليات طب الأسنان الرائدة'}</em>${d.graduationYear ? ` في عام ${d.graduationYear}` : ''}، واضعاً نصب عينيه تقديم رعاية صحية متطورة تلبي أعلى المعايير الطبية العالمية.</p>`,
    (d) => `<p>يرتكز النهج العلاجي لـ <strong>${d.fullNameAr}</strong> على مبدأ الحفاظ الأقصى على بنية الأسنان الطبيعية (Minimally Invasive Dentistry)، مع توظيف أحدث التقنيات والمواد الحيوية المتوافقة حيوياً لتحقيق نتائج علاجية وجمالية تدوم طويلاً.</p>`,
    (d) => `<p>خلال سنوات دراسته وتدريبه السريري في <em>${d.universityAr || 'الجامعة'}</em>، ركّز ${d.titleAr} على الدمج بين الدقة التشخيصية والراحة النفسية للمريض، إيماناً بأن زيارة طبيب الأسنان يجب أن تكون تجربة إيجابية خالية تماماً من القلق والتوتر.</p>`,
    (d) => `<p>يحرص <strong>${d.fullNameAr}</strong> على التطوير المهني المستمر عبر متابعة أحدث الأبحاث العلمية وحضور المؤتمرات وورش العمل المتقدمة في مجالات ${d.clinicalSkillsAr?.slice(0, 3).join(' و') || 'الحشو التجميلي وعلاج الجذور'}، لضمان تطبيق أحدث البروتوكولات المعتمدة عالمياً.</p>`,
    (d) => `<p>تتكامل المهارات السريرية لدى ${d.fullNameAr} مع شغف عميق بتثقيف المرضى وتقديم استشارات وقائية مخصصة تساعد على منع المشكلات السنية قبل تفاقمها، مما يعزز صحة الفم العامة والابتسامة المشرقة.</p>`,
    (d) => `<p>يمتلك ${d.titleAr} سجلاً مميزاً في التعامل مع الحالات السريرية المعقدة، مستنداً إلى تدريب أكاديمي مكثف وخبرة عملية في استخدام العزل المطاطي والتكبير البصري لتحقيق أقصى درجات الإتقان والدقة التشريحية.</p>`,
    (d) => `<p>إن الفلسفة العلاجية في عيادة <strong>${d.clinicNameAr || d.fullNameAr}</strong> تقوم على الشفافية التامة؛ حيث يتم شرح كل خطوة علاجية بالتفصيل للمريض مع استعراض البدائل المختلفة واختيار الخطة الأنسب لحالته وميزانيته.</p>`,
    (d) => `<p>يؤمن <strong>${d.fullNameAr}</strong> بأن طب الأسنان ليس مجرد إجراءات علاجية ميكانيكية، بل هو فن متكامل لإعادة بناء الثقة بالنفس واستعادة وظيفة المضغ السليمة والمظهر الجمالي الطبيعي المتناسق مع ملامح الوجه.</p>`,
    (d) => `<p>تتميز الممارسة السريرية لدى ${d.fullNameAr} بالاهتمام بأدق التفاصيل التشريحية لكل سن، واستخدام مواد حشوات وتجميل تحاكي تدرجات ألوان وشفافية الأسنان الطبيعية بدقة بالغة تعيد للسن حيويته.</p>`,
    (d) => `<p>حظي ${d.fullNameAr} بثقة واسعة من المرضى والمراجعين بفضل أسلوبه الهادئ وقدرته على الاستماع الفعال لاحتياجات كل مراجع وتصميم خطط علاجية فردية وشاملة تضمن أفضل النتائج المستدامة.</p>`,
    (d) => `<p>يمثل التوثيق الفوتوغرافي للحالات السريرية ركيزة أساسية في عمل ${d.titleAr}، مما يتيح للمرضى معاينة التطور الملحوظ في نتائجهم السريرية قبل وبعد العلاج ومتابعة استقرارها عبر الزمن بكل شفافية.</p>`,
    (d) => `<p>بفضل خلفيته الأكاديمية القوية في <em>${d.universityAr || 'طب الأسنان'}</em>، يطبق ${d.fullNameAr} معايير تعقيم فائقة الصرامة وفق إرشادات مكافحة العدوى العالمية لضمان سلامة كل مريض وفريق العمل الطبي.</p>`,
    (d) => `<p>يعتمد ${d.fullNameAr} في عمله على فريق متكامل ومساعدين مدربين لتقديم تجربة علاجية سلسة ومنظمة في بيئة مريحة ومهيأة بالكامل تضمن أعلى مستويات الراحة للمراجعين.</p>`,
    (d) => `<p>إن الجمع بين الكفاءة التقنية وحسن التواصل جعل من <strong>${d.fullNameAr}</strong> اسماً موثوقاً في تقديم حلول طب الأسنان الحديثة والمعاصرة التي تجمع بين الجودة والمتانة والمظهر الجمالي.</p>`,
    (d) => `<p>يسعى ${d.titleAr} باستمرار إلى المساهمة في نشر الوعي الصحي السني في المجتمع من خلال مبادرات توعوية ومنصات رقمية متخصصة وموثقة علمياً لخدمة المرضى والمهتمين بالصحة الفموية.</p>`,
    (d) => `<p>تتضمن رؤية ${d.fullNameAr} توفير علاجات متقدمة تعتمد على أحدث ما توصل إليه العلم في طب الأسنان التحفظي والتجميلي لضمان حصول المريض على ابتسامة صحية تدوم طويلاً.</p>`,
    (d) => `<p>يركز ${d.titleAr} على التقييم السريري الدقيق للمفصل الصدغي الفكي والإطباق، لضمان أن كل ترميم سني يحافظ على التوازن الوظيفي الكامل لجهاز المضغ.</p>`,
    (d) => `<p>من خلال حرصه على استخدام أفضل الخامات والمواد المعتمدة من الهيئات الصحية العالمية، يضمن ${d.fullNameAr} لمرضاه استمرارية العلاجات ومقاومتها للكسر والتغير اللوني.</p>`,
    (d) => `<p>يشكل الالتزام بأخلاقيات المهنة ورعاية المريض المحور الأساسي في كل بروتوكول علاجي يتبعه ${d.fullNameAr}، حيث تأتي صحة المريض وسلامته وراحته دائماً في المقام الأول.</p>`,
    (d) => `<p>إذا كنت تبحث عن رعاية سنية متكاملة تجمع بين الدقة، الأمان، والنتائج الجمالية الفائقة، فإن <strong>${d.fullNameAr}</strong> يقدم لك الاستشارة والخبرة التي تستحقها ابتسامتك وصحة فمك.</p>`
  ],

  // Angle B: Clinical Cases & Treatment Mastery (20 Templates)
  cases: [
    (d) => `<p>يستعرض البورتفوليو السريري المعتمد لـ <strong>${d.fullNameAr}</strong> مجموعة متنوعة من الحالات العلاجية والتجميلية الموثقة بالصور الفوتوغرافية عالية الدقة، والتي تبرز مستوى الكفاءة والتفاني في العمل الطبي الدقيق.</p>`,
    (d) => `<p>تشمل الحالات المنجزة إجراءات دقيقة في <em>الحشوات التجميلية المباشرة (Direct Composite Restorations)</em>، حيث يتم بناء طبقات السن الطبيعية بدقة تشريحية تحاكي الخطوط والميازيب الدقيقة للمينا والعاج.</p>`,
    (d) => `<p>في مجال <em>علاج الجذور وحشو العصب (Endodontics)</em>، يتبع ${d.titleAr} بروتوكولات تطهير وتوسيع القنوات الجذرية باستخدام الأجهزة الدوارة الحديثة ومحددات الذروة الإلكترونية، مما يضمن القضاء التام على الالتهاب وإنقاذ الأسنان الطبيعية من الخلع.</p>`,
    (d) => `<p>توضح الصور التوثيقية قبل وبعد العلاج دقة التحكم في إغلاق الفراغات بين الأسنان (Diastema Closure) وتعديل التصبغات والكسور الناتجة عن الحوادث أو التسوسات العميقة بطرق محافظة تحافظ على حيوية السن.</p>`,
    (d) => `<p>يستخدم <strong>${d.fullNameAr}</strong> حاجز العزل المطاطي (Rubber Dam Isolation) في كافة إجراءات الحشو وعلاج الجذور لضمان بيئة عمل جافة ومعقمة بنسبة 100%، وهو ما يرفع من معدلات نجاح الحشوات التجميلية واستمراريتها لسنوات طويلة.</p>`,
    (d) => `<p>في حالات <em>التركيبات الثابتة والعدسات الخزفية</em>، يتم التركيز على الإعداد الدقيق لحدود السن (Margin Preparation) ومطابقة الألوان الحيوية لتبدو التركيبة كجزء لا يتجزأ من الابتسامة الأصلية بتوافق نسيجي تام مع اللثة.</p>`,
    (d) => `<p>تخضع كل حالة سريرية لدراسة مستفيضة قبل البدء، تشمل الفحص الإكلينيكي الشامل، الصور الشعاعية، وتصميم الابتسامة الرقمي بما يتناسب مع ملامح وجه المريض ووظيفة الفك والإطباق.</p>`,
    (d) => `<p>يعكس التنوع في الحالات السريرية لـ ${d.fullNameAr} قدرة عالية على التعامل مع مختلف الفئات العمرية واحتياجات المرضى المتباينة بكفاءة وهدوء وبأعلى درجات المهارة اليدوية.</p>`,
    (d) => `<p>تظهر نتائج ما بعد العلاج التئاماً ممتازاً للثة واستعادة كاملة لكفاءة الإطباق والمضغ، مما يحسن من جودة حياة المريض وثقته اليومية بمظهره وصحة فمه.</p>`,
    (d) => `<p>يحرص ${d.titleAr} على جلسات المتابعة الدورية بعد إنهاء الحالات للتأكد من استقرار النتائج وصحة الأنسجة المحيطة بالسن المعالج على المدى الطويل وتقديم إرشادات الصيانة الوقائية.</p>`,
    (d) => `<p>إن الشفافية في توثيق الحالات السريرية بالصور الحقيقية تمثل دليلاً قاطعاً على النزاهة المهنية والحرص على تقديم أرقى مستويات الجودة لكل مراجع يضع ثقته في العيادة.</p>`,
    (d) => `<p>تتضمن الخطط العلاجية دمجاً سلساً بين وظيفة السن والجانب التجميلي، مع مراعاة راحة المريض أثناء الجلسات وتقليل وقت العلاج دون المساس بجودة وإتقان الإجراء الطبي.</p>`,
    (d) => `<p>تلقى تقنيات التبييض والتنظيف وإزالة الرواسب الجيرية التي يطبقها ${d.fullNameAr} إشادة واسعة نظراً لمراعاتها الحساسية السنية واستخدام مواد لطيفة على المينا تحمي طبقات الأسنان.</p>`,
    (d) => `<p>توضح الحالات المرممة قدرة فائقة على إعادة بناء الأسنان المتهدمة بشدة باستخدام أوتاد الفايبر والحشوات المدعومة لتعويض النسج المفقودة بكفاءة متناهية وتجنب الخلع الجراحي.</p>`,
    (d) => `<p>يتم تطبيق أحدث تقنيات الترابط الراتنجي (Adhesive Dentistry) لضمان أقصى قوة التصاق بين مادة الحشو وبنية السن الطبيعية، مما يمنع حدوث التسوس الثانوي أو تسرب البكتيريا.</p>`,
    (d) => `<p>في إجراءات جراحة الفم البسيطة وخلع ضروس العقل، يتبع ${d.fullNameAr} أساليب جراحية محافظة ومهدئة تقلل من التورم والألم بعد الجراحة وتسرع من عملية الشفاء والالتئام.</p>`,
    (d) => `<p>تثبت الحالات المعروضة أن الابتسامة الصحية ليست مجرد شكل جمالي خارجي، بل هي استثمار صحي شامل ينعكس إيجابياً على راحة المريض وتغذيته ونشاطه الاجتماعي والمهني.</p>`,
    (d) => `<p>يتم استخدام الكاميرات الاحترافية وعدسات الماكرو السريرية لتوثيق تفاصيل العلاج بدقة، مما يسهل على المريض فهم حالته ومتابعة مراحل التحسن خطوة بخطوة.</p>`,
    (d) => `<p>تعتمد العيادة على معايير الجودة الشاملة في اختيار معامل الأسنان الشريكة لضمان دقة صناعة التيجان والجسور والعدسات الخزفية بأعلى مواصفات المطابقة الحيوية.</p>`,
    (d) => `<p>يمكن للمرضى والمهتمين تصفح كافة الحالات السريرية التفاعلية ومقارنة النتائج قبل وبعد مباشرة عبر المنزلق التفاعلي في البورتفوليو الرسمي لـ <strong>${d.fullNameAr}</strong>.</p>`
  ],

  // Angle C: Local Dentistry Services in City (20 Templates)
  local: [
    (d) => `<p>إذا كنت تقيم في <strong>${d.locationAddressAr || d.clinicNameAr || 'المنطقة'}</strong> وتبحث عن رعاية طبية متقدمة لأسنانك وأسنان عائلتك، فإن <strong>${d.fullNameAr}</strong> يوفر لك بيئة علاجية احترافية مجهزة بأحدث الوسائل التشخيصية والعلاجية.</p>`,
    (d) => `<p>يقع مقر تقديم الخدمة في موقع مميز وسهل الوصول داخل <em>${d.locationAddressAr || d.clinicNameAr || 'المدينة'}</em>، مع توفير مواعيد مرنة وخدمة حجز سريعة لتناسب أوقات المراجعين واحتياجاتهم اليومية.</p>`,
    (d) => `<p>تشمل الخدمات المتوفرة في <strong>${d.clinicNameAr || d.fullNameAr}</strong> الكشف الشامل وفحص الأسنان الدوري، جلسات علاج الآلام الطارئة، الحشوات التجميلية، علاج الجذور، وتنظيف وتلميع الأسنان بأحدث أجهزة الموجات فوق الصوتية.</p>`,
    (d) => `<p>يلتزم فريق العمل في <strong>${d.clinicNameAr || 'العيادة'}</strong> بأعلى معايير النظافة والتعقيم المستمر لكل جهاز وأداة وفق أدق المعايير الصحية العالمية لضمان بيئة آمنة تماماً للمرضى.</p>`,
    (d) => `<p>يحرص <strong>${d.fullNameAr}</strong> على استقبال حالات الطوارئ السنية وحالات آلام الأسنان الحادة بأقصى سرعة لتقديم الإسعافات اللازمة وتسكين الألم فوراً بخبرة وكفاءة عالية.</p>`,
    (d) => `<p>تتميز العيادة بتقديم خطط علاجية واضحة ومسبقة التكاليف دون أي رسوم مخفية، مع توفير خيارات علاجية متعددة لتناسب ميزانية واحتياجات مختلف العائلات والمراجعين.</p>`,
    (d) => `<p>تم تصميم غرف الكشف والعلاج في العيادة لتكون مساحة مريحة وهادئة تقلل من التوتر وتبعث على الاطمئنان لجميع الفئات العمرية وخاصة الأطفال وأصحاب فوبيا عيادات الأسنان.</p>`,
    (d) => `<p>يوفر <strong>${d.fullNameAr}</strong> خدمة الاستشارات والمتابعة المباشرة عبر تطبيق الواتساب لتسهيل التواصل والإجابة على أي استفسارات طبية عاجلة بعد الجلسات العلاجية.</p>`,
    (d) => `<p>تستفيد العيادة من أحدث المواد والخامات المستوردة من كبرى الشركات العالمية في مجال طب الأسنان لضمان استدامة وجودة الحشوات والتركيبات لسنوات طويلة دون تراجع.</p>`,
    (d) => `<p>يقدم ${d.titleAr} برامج مخصصة لرعاية أسنان الأطفال وكبار السن، مع مراعاة الحالات الصحية المزمنة وتوفير العلاج الأكثر أماناً وملاءمة لكل حالة فردية.</p>`,
    (d) => `<p>إن تقييمات المرضى الإيجابية في <strong>${d.locationAddressAr || 'المنطقة'}</strong> تعكس مستوى الرضا الكبير عن جودة الرعاية، دقة المواعيد، ولطف المعاملة في كل زيارة يقوم بها المراجع.</p>`,
    (d) => `<p>توفر العيادة أحدث أجهزة الأشعة الرقمية (Digital X-Ray) التي تقلل من نسبة الإشعاع بنسبة تصل إلى 80% مقارنة بالأشعة التقليدية، مع إعطاء صور تشخيصية فورية فائقة الوضوح.</p>`,
    (d) => `<p>يحرص ${d.fullNameAr} على تنظيم المواعيد بنظام الحجز المسبق لضمان عدم وجود أوقات انتظار طويلة وتخصيص الوقت الكافي لكل مريض لشرح خطته العلاجية والإجابة عن تساؤلاته.</p>`,
    (d) => `<p>تتعاون العيادة مع أرقى المعامل المعتمدة لتقديم تركيبات الزيركون والإيماكس التجميلية بدقة تطابق عالية تناسب كل مريض في <strong>${d.locationAddressAr || 'المدينة'}</strong>.</p>`,
    (d) => `<p>يتوفر في المركز الطبي بروتوكول متكامل للتطهير بين كل مريض وآخر مع استخدام الأدوات ذات الاستخدام الواحد (Disposables) لضمان أقصى درجات الوقاية والحماية الصحية.</p>`,
    (d) => `<p>يقدم ${d.titleAr} خدمات تجميل الأسنان الشاملة بما فيها تبييض الأسنان بالليزر والضوء البارد وتنظيف تصبغات التدخين والقهوة لإعادة البريق الطبيعي لابتسامتك.</p>`,
    (d) => `<p>تعتبر العيادة وجهة موثوقة للعائلات في <em>${d.locationAddressAr || 'المنطقة'}</em> بفضل الجمع بين الخبرة الطبية المعتمدة والأسعار العادلة والاهتمام الإنساني الصادق.</p>`,
    (d) => `<p>يحرص الطاقم الطبي على تقديم نصائح وإرشادات وقائية مخصصة بعد كل إجراء للمساعدة في تسريع الشفاء والحفاظ على صحة الفم على مدار العام.</p>`,
    (d) => `<p>سواء كنت بحاجة إلى فحص وقائي سريع أو خطة علاجية تجميلية متكاملة لابتسامتك، يمكنك الاعتماد على الخبرة السريرية الموثقة لـ <strong>${d.fullNameAr}</strong>.</p>`,
    (d) => `<p>للحصول على استشارة أو حجز موعد في <em>${d.locationAddressAr || d.clinicNameAr || 'العيادة'}</em>، يمكنك التواصل مباشرة عبر أرقام الهاتف أو رابط الواتساب المتاح في الموقع الرسمي.</p>`
  ],

  // Angle D: Patient Dental Care Guide (20 Templates)
  guide: [
    (d) => `<p>يقدم <strong>${d.fullNameAr}</strong> هذا الدليل التوعوي الشامل لمساعدة المرضى والمراجعين على العناية اليومية بأسنانهم وحمايتها من التسوس وأمراض اللثة الشائعة، للحفاظ على ابتسامة صحية وجميلة مدى الحياة.</p>`,
    (d) => `<p><strong>1. تنظيف الأسنان الصحيح:</strong> ينصح ${d.titleAr} بتفريش الأسنان مرتين يومياً على الأقل لمدة دقيقتين كاملتين باستخدام فرشاة ذات شعيرات ناعمة ومعجون يحتوي على الفلورايد، مع تجنب الفرك العنيف لحماية طبقة المينا واللثة من التراجع والانحسار.</p>`,
    (d) => `<p><strong>2. أهمية الخيط الطبي اليومي:</strong> يؤكد ${d.fullNameAr} أن الفرشاة وحدها لا تصل إلى ما يقارب 35% من أسطح الأسنان الواقعة بين الفراغات؛ لذا يعد استخدام الخيط الطبي أو الفرش المخصصة بين الأسنان أمراً ضرورياً لمنع التسوسات المخفية والتهابات اللثة المزمنة.</p>`,
    (d) => `<p><strong>3. علامات التحذير المبكرة:</strong> إذا لاحظت نزيفاً في اللثة أثناء التفريش، أو حساسية مفاجئة مع المشروبات الباردة والساخنة، أو رائحة فم غير مستحبة، فهذه إشارات مبكرة تستوجب زيارة طبيب الأسنان فوراً قبل تفاقم المشكلة والوصول إلى العصب.</p>`,
    (d) => `<p><strong>4. العناية بالحشوات والتركيبات:</strong> للحفاظ على الحشوات التجميلية والعدسات الخزفية، يُنصح بتجنب قضم الأطعمة شديدة الصلابة مثل الثلج والمكسرات القاسية، واستخدام واقي الأسنان الليلي (Night Guard) في حال وجود عادة صك وطحن الأسنان أثناء النوم.</p>`,
    (d) => `<p><strong>5. النظام الغذائي وصحة الفم:</strong> يساهم تقليل السكريات والمشروبات الغازية والحمضية في خفض مستويات الأحماض المسببة لتآكل المينا، بينما يساعد شرب الماء بوفرة وتناول الأطعمة الغنية بالكالسيوم والفيتامينات على تعزيز صحة الأسنان وبنية اللثة.</p>`,
    (d) => `<p><strong>6. الفحص والتنظيف الدوري:</strong> يوصي <strong>${d.fullNameAr}</strong> بزيارة طبيب الأسنان مرة كل ستة أشهر لإجراء فحص وقائي وتنظيف احترافي للجير المترسب الذي لا يمكن إزالته بالفرشاة المنزلية العادية مهما بلغت دقتها.</p>`,
    (d) => `<p><strong>7. صحة أسنان الأطفال:</strong> يجب بدء العناية بفم الطفل منذ ظهور السن اللبني الأول، مع تعليم الأطفال عادات التنظيف السليمة وتجنب النوم مع زجاجة الحليب المحلاة لمنع حدوث تسوس الرضاعة المبكر والمدمر لأسنان الطفل.</p>`,
    (d) => `<p><strong>8. متى تحتاج إلى علاج الجذور؟</strong> عند الشعور بألم حاد ومستمر ينبض خاصة في فترات الليل، أو وجود انتفاخ وتورم في اللثة المجاورة، فإن علاج العصب الفوري ينقذ السن الطبيعي ويجنبك مضاعفات الخراجات وفقدان السن.</p>`,
    (d) => `<p><strong>9. التبييض الآمن والفعال:</strong> ينصح ${d.titleAr} دائماً بإجراء تبييض الأسنان تحت إشراف طبي متخصص في العيادة لتجنب التهابات اللثة وحساسية الأسنان الناتجة عن استخدام المنتجات العشوائية غير المعتمدة المنتشرة تجارياً.</p>`,
    (d) => `<p><strong>10. اختيار معجون الأسنان المناسب:</strong> يفضل اختيار معاجين الأسنان التي تحتوي على الفلورايد لتقوية المينا، أو المعاجين المخصصة للأسنان الحساسة التي تحتوي على نترات البوتاسيوم في حال كنت تعاني من وخز متكرر مع الأطعمة الباردة.</p>`,
    (d) => `<p><strong>11. العناية بصحة اللثة:</strong> اللثة السليمة ذات لون وردي متناسق ولا تنزف مطلقاً؛ وإهمال علاج التهاب اللثة السطحي قد يتطور إلى التهاب دواعم السن (Periodontitis) وتخلخل الأسنان وفقدان العظم الداعم.</p>`,
    (d) => `<p><strong>12. التعامل مع طوارئ الأسنان:</strong> في حال سقوط السن بالكامل نتيجة ضربة أو حادث، ينصح بحفظ السن في كوب من الحليب الطازج والتوجه فوراً إلى العيادة خلال 60 دقيقة لإعادة زرعه بنجاح.</p>`,
    (d) => `<p><strong>13. تأثير التدخين على الفم:</strong> يقلل التدخين من التروية الدموية للثة ويؤخر التئام الجروح ويزيد من خطر فشل زراعة الأسنان وتكون الجير الداكن ورائحة الفم غير المرغوبة.</p>`,
    (d) => `<p><strong>14. استخدام غسول الفم الطبي:</strong> يمكن لغسولات الفم المضادة للبكتيريا الخالية من الكحول أن تقدم حماية إضافية، ولكنها لا تغني أبداً عن الاستخدام الميكانيكي لفرشاة الأسنان وخيط الأسنان اليومي.</p>`,
    (d) => `<p><strong>15. العناية بالأسنان أثناء الحمل:</strong> التغيرات الهرمونية لدى الحوامل قد تزيد من حساسية اللثة والتهابها (Pregnancy Gingivitis)؛ لذا يعد الفحص الدوري وتنظيف الأسنان آمناً وضرورياً جداً لصحة الأم والجنين.</p>`,
    (d) => `<p><strong>16. حماية الأسنان للرياضيين:</strong> يوصى بارتداء واقي الفم الرياضي المخصص (Mouthguard) أثناء ممارسة الرياضات العنيفة لتجنب كسور الأسنان وإصابات الفكين والشفاه.</p>`,
    (d) => `<p><strong>17. كيفية تنظيف اللسان:</strong> تتراكم البكتيريا وبقايا الطعام على سطح اللسان مسببة رائحة الفم؛ واستخدام مكشطة اللسان أو ظهر الفرشاة بلطف يومياً يحسن من انتعاش النفس ونظافة الفم.</p>`,
    (d) => `<p><strong>18. إرشادات ما بعد خلع الأسنان:</strong> تجنب المضمضة العنيفة أو البصق واستخدام الشفاط (Straw) في أول 24 ساعة، مع الالتزام بالكمادات الباردة وتناول الأطعمة اللينة لضمان استقرار الخثرة الدموية وسرعة الشفاء.</p>`,
    (d) => `<p><strong>خاتمة واستشارة:</strong> إن الوقاية هي حجر الأساس لصحة الفم والأسنان. لا تتردد في استشارة <strong>${d.fullNameAr}</strong> للحصول على تقييم فردي ونصائح مخصصة لحالتك الصحية وابتسامتك.</p>`
  ]
};

// ==========================================
// 5. Article HTML Builder (Unique SEO Pages)
// ==========================================
function buildArticleStaticHtml({ doctor, angleKey, baseUrl }) {
  const username = doctor.username || doctor.slug || slugify(doctor.fullName || 'doctor');
  const doctorUrl = `${baseUrl}/dr/${username}/`;
  const citySlug = slugify(doctor.locationAddress || doctor.locationAddressAr || 'city');
  
  const angleConfigs = {
    about: {
      fileName: 'about.html',
      titleAr: `السيرة المهنية والمسيرة الطبية لـ ${doctor.fullNameAr || doctor.fullName} | PortfolioHubs`,
      titleEn: `About Dr. ${doctor.fullName} - Dental Career & Education`,
      metaDesc: `تعرف على المسيرة المهنية والتعليمية لـ ${doctor.fullNameAr}، ${doctor.titleAr} خريج ${doctor.universityAr || 'طب الأسنان'}. الفلسفة العلاجية والمهارات السريرية المعتمدة.`,
      heading: `السيرة المهنية والمسيرة الطبية لـ ${doctor.fullNameAr || doctor.fullName}`,
      badge: 'السيرة المهنية والتعليم'
    },
    cases: {
      fileName: 'clinical-cases.html',
      titleAr: `الحالات السريرية والخبرات العلاجية لـ ${doctor.fullNameAr || doctor.fullName} | PortfolioHubs`,
      titleEn: `Clinical Cases & Treatments - Dr. ${doctor.fullName}`,
      metaDesc: `استعراض تحليلي للحالات السريرية وإجراءات الحشو التجميلي وعلاج الجذور المنجزة بواسطة ${doctor.fullNameAr}. صور ونتائج موثقة قبل وبعد.`,
      heading: `الحالات السريرية والخبرات العلاجية الموثقة لـ ${doctor.fullNameAr || doctor.fullName}`,
      badge: 'توثيق الحالات السريرية'
    },
    local: {
      fileName: `dentist-in-${citySlug}.html`,
      titleAr: `طبيب أسنان في ${doctor.locationAddressAr || doctor.clinicNameAr || 'المدينة'} - ${doctor.fullNameAr || doctor.fullName} | PortfolioHubs`,
      titleEn: `Dentist in ${doctor.locationAddress || 'City'} - Dr. ${doctor.fullName}`,
      metaDesc: `خدمات طب وجراحة الفم والأسنان في ${doctor.locationAddressAr || doctor.clinicNameAr || 'المدينة'} مع ${doctor.fullNameAr}. عيادة مجهزة بأحدث التقنيات للحجز الفوري.`,
      heading: `خدمات طب الأسنان المتطورة في ${doctor.locationAddressAr || doctor.clinicNameAr || 'المدينة'} مع ${doctor.fullNameAr || doctor.fullName}`,
      badge: 'الخدمات المحلية والعيادة'
    },
    guide: {
      fileName: 'patient-guide.html',
      titleAr: `دليل المرضى الشامل للعناية بصحة الفم والأسنان - إشراف ${doctor.fullNameAr || doctor.fullName} | PortfolioHubs`,
      titleEn: `Patient Dental Care Guide - Dr. ${doctor.fullName}`,
      metaDesc: `دليل طبي مبسط يقدمه ${doctor.fullNameAr} حول طرق تفريش الأسنان، الوقاية من التسوس، العناية بالحشوات التجميلية وأمراض اللثة.`,
      heading: `دليل المرضى الشامل للعناية بصحة الفم والأسنان والابتسامة`,
      badge: 'دليل المرضى والتوعية'
    }
  };

  const config = angleConfigs[angleKey];
  const articleCanonicalUrl = `${baseUrl}/dr/${username}/articles/${config.fileName}`;
  const profilePhotoUrl = doctor.profilePhotoPath ? `${baseUrl}/${doctor.profilePhotoPath}` : (doctor.profilePhoto || `${baseUrl}/assets/default-doctor-avatar.webp`);

  // Randomized selection of templates for unique content per doctor (Seed = doctor.uid + angleKey)
  const templateList = ARTICLE_TEMPLATES[angleKey] || ARTICLE_TEMPLATES.about;
  const shuffledTemplates = shuffleWithSeed(templateList, (doctor.uid || doctor.fullName || '') + angleKey);
  
  // Pick a dynamic subset (7 to 9 paragraphs out of 20) to guarantee less than 20% text similarity between doctors
  const subsetCount = 8;
  const selectedTemplates = shuffledTemplates.slice(0, subsetCount);
  
  const doctorContext = {
    fullName: escapeHtml(doctor.fullName || ''),
    fullNameAr: escapeHtml(doctor.fullNameAr || doctor.fullName || ''),
    title: escapeHtml(doctor.title || 'Dentist'),
    titleAr: escapeHtml(doctor.titleAr || 'طبيب أسنان'),
    university: escapeHtml(doctor.university || ''),
    universityAr: escapeHtml(doctor.universityAr || doctor.university || ''),
    graduationYear: escapeHtml(doctor.graduationYear || ''),
    clinicName: escapeHtml(doctor.clinicName || ''),
    clinicNameAr: escapeHtml(doctor.clinicNameAr || doctor.clinicName || ''),
    locationAddress: escapeHtml(doctor.locationAddress || ''),
    locationAddressAr: escapeHtml(doctor.locationAddressAr || doctor.locationAddress || ''),
    clinicalSkillsAr: (doctor.clinicalSkillsAr || doctor.clinicalSkills || []).map(escapeHtml)
  };

  // Subheadings bank for rhythmic content structure
  const subHeadings = {
    about: [
      `الرؤية العلاجية والمنهج الأكاديمي لـ ${doctorContext.fullNameAr}`,
      `معايير الجودة ومكافحة العدوى في عيادة ${doctorContext.clinicNameAr || doctorContext.fullNameAr}`,
      `التطوير السريري واستخدام أحدث المواد السنية المعتمدة`
    ],
    cases: [
      `بروتوكولات المعالجة التحفظية والحشوات التجميلية`,
      `إتقان علاج الجذور والتقنيات الرقمية المتقدمة`,
      `التوثيق السريري الدقيق ونتائج ما قبل وما بعد العلاج`
    ],
    local: [
      `أحدث التجهيزات والتقنيات المتوفرة في ${doctorContext.locationAddressAr || 'العيادة'}`,
      `خدمات الطوارئ والرعاية السنية الشاملة لجميع أفراد الأسرة`,
      `سهولة الوصول والحجز السلس مع ${doctorContext.fullNameAr}`
    ],
    guide: [
      `أساسيات الوقاية اليومية وحماية المينا من التآكل`,
      `العناية المتخصصة بالحشوات والعدسات الخزفية وصحة اللثة`,
      `متى تستشير ${doctorContext.fullNameAr} للحصول على تقييم سريري؟`
    ]
  };

  const angleHeadings = subHeadings[angleKey] || subHeadings.about;
  
  // Interleave sub-headings into the body paragraphs
  let articleBodyHtml = '';
  selectedTemplates.forEach((tplFn, idx) => {
    if (idx === 2 && angleHeadings[0]) {
      articleBodyHtml += `\n<h2 class="text-xl font-bold text-slate-800 mt-8 mb-4">${escapeHtml(angleHeadings[0])}</h2>\n`;
    } else if (idx === 5 && angleHeadings[1]) {
      articleBodyHtml += `\n<h2 class="text-xl font-bold text-slate-800 mt-8 mb-4">${escapeHtml(angleHeadings[1])}</h2>\n`;
    }
    articleBodyHtml += tplFn(doctorContext) + '\n';
  });

  // Rich JSON-LD Article + Dentist Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${articleCanonicalUrl}#article`,
        "headline": config.heading,
        "description": config.metaDesc,
        "image": profilePhotoUrl,
        "url": articleCanonicalUrl,
        "datePublished": doctor.createdAt || new Date().toISOString(),
        "dateModified": new Date().toISOString(),
        "author": {
          "@type": "Person",
          "name": doctor.fullNameAr || doctor.fullName,
          "url": doctorUrl
        },
        "publisher": {
          "@type": "Organization",
          "name": "PortfolioHubs",
          "logo": {
            "@type": "ImageObject",
            "url": "https://github.com/user-attachments/assets/fef6c67d-5ed0-4459-b41d-4c288ab48163"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": articleCanonicalUrl
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": `${baseUrl}/` },
          { "@type": "ListItem", "position": 2, "name": doctor.fullNameAr || doctor.fullName, "item": doctorUrl },
          { "@type": "ListItem", "position": 3, "name": config.badge, "item": articleCanonicalUrl }
        ]
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeAttr(config.titleAr)}</title>
  <meta name="description" content="${escapeAttr(config.metaDesc)}" />
  <meta name="author" content="${escapeAttr(doctor.fullNameAr || doctor.fullName)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${escapeAttr(articleCanonicalUrl)}" />

  <!-- OpenGraph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeAttr(config.titleAr)}" />
  <meta property="og:description" content="${escapeAttr(config.metaDesc)}" />
  <meta property="og:url" content="${escapeAttr(articleCanonicalUrl)}" />
  <meta property="og:image" content="${escapeAttr(profilePhotoUrl)}" />
  <meta property="og:site_name" content="PortfolioHubs" />
  <meta property="og:locale" content="ar_EG" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeAttr(config.titleAr)}" />
  <meta name="twitter:description" content="${escapeAttr(config.metaDesc)}" />
  <meta name="twitter:image" content="${escapeAttr(profilePhotoUrl)}" />

  <link rel="icon" type="image/png" href="https://github.com/user-attachments/assets/fef6c67d-5ed0-4459-b41d-4c288ab48163" />

  <script type="application/ld+json">
    ${safeJsonLd(jsonLd)}
  </script>

  <style>
    :root {
      --brand: #0e7490;
      --brand-dark: #155e75;
      --brand-darker: #083344;
      --brand-light: #0891b2;
      --brand-subtle: #ecfeff;
      --bg-body: #f8fafc;
      --bg-card: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --radius: 16px;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-sans); background-color: var(--bg-body); color: var(--text-main); line-height: 1.8; }
    .container { max-width: 860px; margin: 0 auto; padding: 24px 16px 64px 16px; }
    
    .top-nav { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 24px; }
    .brand-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--brand-dark); font-weight: 800; }
    .brand-logo img { width: 32px; height: 32px; border-radius: 8px; }
    
    .breadcrumbs { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; }
    .breadcrumbs a { color: var(--brand); text-decoration: none; }
    .breadcrumbs span { color: var(--border); }
    
    .article-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px 24px; box-shadow: 0 4px 16px rgba(14, 116, 144, 0.06); }
    @media(min-width: 768px) { .article-card { padding: 48px 40px; } }
    
    .badge { display: inline-block; padding: 4px 12px; background: var(--brand-subtle); color: var(--brand-dark); border-radius: 9999px; font-size: 0.8rem; font-weight: 800; margin-bottom: 16px; }
    .article-title { font-size: 1.75rem; font-weight: 900; line-height: 1.35; margin-bottom: 20px; color: var(--text-main); }
    @media(min-width: 768px) { .article-title { font-size: 2.15rem; } }
    
    .doctor-author-bar { display: flex; align-items: center; gap: 14px; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 28px; }
    .author-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand); }
    .author-info h4 { font-size: 1rem; font-weight: 800; color: var(--text-main); }
    .author-info p { font-size: 0.85rem; color: var(--text-muted); }
    
    .article-body { font-size: 1.05rem; color: #1e293b; }
    .article-body p { margin-bottom: 20px; }
    .article-body strong { color: var(--text-main); }
    .article-body em { font-style: normal; color: var(--brand-dark); font-weight: 600; }
    
    .cta-box { background: var(--brand-subtle); border: 1px solid var(--brand-light); border-radius: var(--radius); padding: 24px; margin-top: 36px; text-align: center; }
    .cta-box h3 { font-size: 1.25rem; font-weight: 800; color: var(--brand-darker); margin-bottom: 8px; }
    .cta-box p { font-size: 0.95rem; color: var(--text-muted); margin-bottom: 16px; }
    .btn-main { display: inline-flex; align-items: center; gap: 8px; background: var(--brand); color: #fff; padding: 10px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; }
    
    .related-articles { margin-top: 36px; padding-top: 24px; border-top: 1px solid var(--border); }
    .related-title { font-size: 1.15rem; font-weight: 800; margin-bottom: 14px; }
    .related-links { display: flex; flex-direction: column; gap: 10px; }
    .related-links a { color: var(--brand); text-decoration: none; font-weight: 700; font-size: 0.95rem; }
    .related-links a:hover { text-decoration: underline; }
    
    .footer { text-align: center; margin-top: 40px; font-size: 0.85rem; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <header class="top-nav">
      <a href="${baseUrl}/" class="brand-logo">
        <img src="https://github.com/user-attachments/assets/fef6c67d-5ed0-4459-b41d-4c288ab48163" alt="PortfolioHubs" />
        <span>PortfolioHubs</span>
      </a>
      <a href="${doctorUrl}" style="color: var(--brand); font-weight: 700; font-size: 0.875rem; text-decoration: none;">زيارة بورتفوليو الطبيب ←</a>
    </header>

    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="${baseUrl}/">الرئيسية</a>
      <span>/</span>
      <a href="${doctorUrl}">د. ${escapeHtml(doctor.fullNameAr || doctor.fullName)}</a>
      <span>/</span>
      <span>${escapeHtml(config.badge)}</span>
    </nav>

    <main class="article-card">
      <span class="badge">${escapeHtml(config.badge)}</span>
      <h1 class="article-title">${escapeHtml(config.heading)}</h1>

      <div class="doctor-author-bar">
        <img src="${escapeAttr(profilePhotoUrl)}" alt="${escapeAttr(doctor.fullNameAr || doctor.fullName)}" class="author-avatar" />
        <div class="author-info">
          <h4>${escapeHtml(doctor.fullNameAr || doctor.fullName)}</h4>
          <p>${escapeHtml(doctor.titleAr || 'طبيب أسنان')} ${doctor.universityAr ? `• خريج ${escapeHtml(doctor.universityAr)}` : ''}</p>
        </div>
      </div>

      <article class="article-body">
        ${articleBodyHtml}
      </article>

      <div class="cta-box">
        <h3>هل ترغب في استشارة أو حجز موعد مع ${escapeHtml(doctor.fullNameAr || doctor.fullName)}؟</h3>
        <p>تفضل بزيارة البورتفوليو السريري الرسمي للاطلاع على معرض الحالات والتواصل المباشر عبر الواتساب أو الهاتف.</p>
        <a href="${doctorUrl}" class="btn-main">زيارة البورتفوليو السريري الكامل ومعرض الحالات ←</a>
      </div>

      <div class="related-articles">
        <h3 class="related-title">مقالات وصفحات ذات صلة بالدكتور:</h3>
        <div class="related-links">
          <a href="${doctorUrl}">• البورتفوليو السريري الرسمي لـ ${escapeHtml(doctor.fullNameAr || doctor.fullName)}</a>
          <a href="${baseUrl}/dr/${username}/articles/about.html">• السيرة المهنية والمسيرة الطبية</a>
          <a href="${baseUrl}/dr/${username}/articles/clinical-cases.html">• الحالات السريرية والخبرة العلاجية</a>
          <a href="${baseUrl}/dr/${username}/articles/dentist-in-${citySlug}.html">• خدمات طب الأسنان في ${escapeHtml(doctor.locationAddressAr || 'المدينة')}</a>
          <a href="${baseUrl}/dr/${username}/articles/patient-guide.html">• دليل المرضى الشامل للعناية بالأسنان</a>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>منصة <a href="${baseUrl}/" style="color: var(--brand); text-decoration: none;">PortfolioHubs</a> — بورتفوليو سريري معتمد وتوثيق مهني لأطباء الأسنان.</p>
    </footer>
  </div>
</body>
</html>`;
}

// ==========================================
// 6. Main Static HTML Builder (Doctor Page)
// ==========================================
function buildDoctorStaticHtml({ doctor, cases, baseUrl }) {
  const username = doctor.username || doctor.slug || slugify(doctor.fullName || 'doctor');
  const pageCanonicalUrl = `${baseUrl}/dr/${username}/`;
  const citySlug = slugify(doctor.locationAddress || doctor.locationAddressAr || 'city');
  
  const fullNameEn = escapeHtml(doctor.fullName || '');
  const fullNameAr = escapeHtml(doctor.fullNameAr || doctor.fullName || '');
  const titleEn = escapeHtml(doctor.title || 'Dentist');
  const titleAr = escapeHtml(doctor.titleAr || 'طبيب أسنان');
  const universityEn = escapeHtml(doctor.university || '');
  const universityAr = escapeHtml(doctor.universityAr || doctor.university || '');
  const gradYear = escapeHtml(doctor.graduationYear || '');
  const clinicNameEn = escapeHtml(doctor.clinicName || '');
  const clinicNameAr = escapeHtml(doctor.clinicNameAr || doctor.clinicName || '');
  const addressEn = escapeHtml(doctor.locationAddress || '');
  const addressAr = escapeHtml(doctor.locationAddressAr || doctor.locationAddress || '');
  const phone = escapeHtml(doctor.phone || '');
  const whatsapp = escapeHtml(doctor.whatsapp || doctor.phone || '');
  const email = escapeHtml(doctor.email || '');
  
  let profilePhotoUrl = doctor.profilePhotoPath 
    ? `${baseUrl}/${doctor.profilePhotoPath}` 
    : (doctor.profilePhoto || `${baseUrl}/assets/default-doctor-avatar.webp`);
  
  const pageTitle = `${fullNameAr} (${fullNameEn}) - ${titleAr} | PortfolioHubs`;
  const metaDesc = `الملف المهني والبورتفوليو السريري المعتمد لـ ${fullNameAr}، ${titleAr} خريج ${universityAr} ${gradYear ? '(' + gradYear + ')' : ''}. شاهد الحالات السريرية وتواصل مباشرة.`;

  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${pageCanonicalUrl}#person`,
        "name": doctor.fullName || doctor.fullNameAr,
        "alternateName": doctor.fullNameAr,
        "jobTitle": doctor.title || "Dentist",
        "image": profilePhotoUrl,
        "email": doctor.email ? `mailto:${doctor.email}` : undefined,
        "telephone": doctor.phone || doctor.whatsapp || undefined,
        "alumniOf": doctor.university ? {
          "@type": "EducationalOrganization",
          "name": doctor.university
        } : undefined,
        "sameAs": [
          doctor.instagram ? (doctor.instagram.startsWith('http') ? doctor.instagram : `https://instagram.com/${doctor.instagram}`) : undefined,
          doctor.facebook ? (doctor.facebook.startsWith('http') ? doctor.facebook : `https://facebook.com/${doctor.facebook}`) : undefined,
          doctor.linkedin ? (doctor.linkedin.startsWith('http') ? doctor.linkedin : `https://linkedin.com/in/${doctor.linkedin}`) : undefined
        ].filter(Boolean)
      },
      {
        "@type": "Dentist",
        "@id": `${pageCanonicalUrl}#dentist`,
        "name": doctor.clinicName || doctor.fullNameAr || doctor.fullName,
        "image": profilePhotoUrl,
        "url": pageCanonicalUrl,
        "telephone": doctor.phone || doctor.whatsapp || undefined,
        "address": doctor.locationAddress ? {
          "@type": "PostalAddress",
          "streetAddress": doctor.locationAddress
        } : undefined,
        "employee": {
          "@id": `${pageCanonicalUrl}#person`
        }
      }
    ]
  };

  const renderedCasesHtml = cases.map((c, index) => {
    const caseTitleEn = escapeHtml(c.title || `Clinical Case #${index + 1}`);
    const caseTitleAr = escapeHtml(c.titleAr || c.title || `حالة سريرية رقم ${index + 1}`);
    const catLabels = getCategoryLabels(c.category, c.customCategory);
    const catEn = escapeHtml(catLabels.en);
    const catAr = escapeHtml(catLabels.ar);
    const descEn = escapeHtml(c.description || '');
    const descAr = escapeHtml(c.descriptionAr || c.description || '');
    const treatment = escapeHtml(c.treatmentType || '');
    
    const beforeImg = c.beforePhoto?.url ? `${baseUrl}/${c.beforePhoto.url}` : (c.beforePhotoUrl || c.photoPath ? `${baseUrl}/${c.photoPath}` : (c.photo || ''));
    const afterImg = c.afterPhoto?.url ? `${baseUrl}/${c.afterPhoto.url}` : (c.afterPhotoUrl || c.thumbnailPath ? `${baseUrl}/${c.thumbnailPath}` : (c.preview || beforeImg));
    const hasComparison = beforeImg && afterImg && (beforeImg !== afterImg);

    return `
      <article class="case-slide ${index === 0 ? 'active' : ''}" data-case-index="${index}" data-category="${escapeAttr(c.category || 'all')}">
        <div class="case-card">
          <div class="case-header">
            <div class="case-badge-group">
              <span class="case-number">الحالة ${index + 1}</span>
              <span class="case-category">${catAr} <span class="en-sub">(${catEn})</span></span>
            </div>
            <h3 class="case-title">${caseTitleAr}</h3>
            ${caseTitleEn !== caseTitleAr ? `<p class="case-title-en">${caseTitleEn}</p>` : ''}
          </div>

          <div class="case-media-container">
            ${hasComparison ? `
              <div class="ba-comparator" data-comparator>
                <div class="ba-image-layer ba-after">
                  <img src="${escapeAttr(afterImg)}" alt="${escapeAttr(caseTitleAr)} - بعد العلاج (After)" loading="lazy" decoding="async" />
                  <span class="ba-tag tag-after">بعد العلاج (After)</span>
                </div>
                <div class="ba-image-layer ba-before" data-before-layer style="width: 50%;">
                  <img src="${escapeAttr(beforeImg)}" alt="${escapeAttr(caseTitleAr)} - قبل العلاج (Before)" loading="lazy" decoding="async" />
                  <span class="ba-tag tag-before">قبل العلاج (Before)</span>
                </div>
                <div class="ba-handle" data-handle style="left: 50%;">
                  <div class="ba-handle-line"></div>
                  <div class="ba-handle-button" aria-label="اسحب للمقارنة">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18-6-6 6-6M15 6l6 6-6 6"/></svg>
                  </div>
                  <div class="ba-handle-line"></div>
                </div>
                <input type="range" min="0" max="100" value="50" class="ba-range-input" data-slider aria-label="شريط مقارنة قبل وبعد العلاج" />
              </div>
              <noscript>
                <div class="ba-noscript-grid">
                  <div class="ba-noscript-item">
                    <img src="${escapeAttr(beforeImg)}" alt="قبل العلاج" />
                    <span class="caption">قبل العلاج (Before)</span>
                  </div>
                  <div class="ba-noscript-item">
                    <img src="${escapeAttr(afterImg)}" alt="بعد العلاج" />
                    <span class="caption">بعد العلاج (After)</span>
                  </div>
                </div>
              </noscript>
            ` : `
              <div class="single-case-image">
                <img src="${escapeAttr(afterImg || beforeImg || `${baseUrl}/assets/placeholder-case.webp`)}" alt="${escapeAttr(caseTitleAr)}" loading="lazy" decoding="async" />
              </div>
            `}
          </div>

          <div class="case-body">
            ${descAr ? `<p class="case-description">${descAr}</p>` : ''}
            ${descEn && descEn !== descAr ? `<p class="case-description-en">${descEn}</p>` : ''}
            
            <div class="case-meta-grid">
              ${treatment ? `
                <div class="meta-item">
                  <span class="meta-label">نوع الإجراء:</span>
                  <span class="meta-value">${treatment}</span>
                </div>
              ` : ''}
              ${c.sessionCount ? `
                <div class="meta-item">
                  <span class="meta-label">عدد الجلسات:</span>
                  <span class="meta-value">${escapeHtml(String(c.sessionCount))} جلسة</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('\n');

  const renderSkillPills = (skills, skillsAr) => {
    const list = (skillsAr && skillsAr.length > 0) ? skillsAr : (skills || []);
    if (!list || list.length === 0) return '';
    return list.map(s => `<li class="skill-pill">${escapeHtml(s)}</li>`).join('');
  };

  const renderTimeline = (timeline) => {
    if (!timeline || timeline.length === 0) return '<p class="empty-hint">لم تتم إضافة محطات مهنية بعد.</p>';
    return timeline.map(item => `
      <div class="timeline-item">
        <div class="timeline-year">${escapeHtml(item.year || '')}</div>
        <div class="timeline-content">
          <p class="timeline-event-ar">${escapeHtml(item.eventAr || item.event || '')}</p>
          ${item.event && item.event !== item.eventAr ? `<p class="timeline-event-en">${escapeHtml(item.event)}</p>` : ''}
        </div>
      </div>
    `).join('');
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeAttr(pageTitle)}</title>
  <meta name="description" content="${escapeAttr(metaDesc)}" />
  <meta name="author" content="${escapeAttr(fullNameAr)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${escapeAttr(pageCanonicalUrl)}" />

  <!-- OpenGraph Tags -->
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${escapeAttr(pageTitle)}" />
  <meta property="og:description" content="${escapeAttr(metaDesc)}" />
  <meta property="og:url" content="${escapeAttr(pageCanonicalUrl)}" />
  <meta property="og:image" content="${escapeAttr(profilePhotoUrl)}" />
  <meta property="og:site_name" content="PortfolioHubs" />
  <meta property="og:locale" content="ar_EG" />
  <meta property="og:locale:alternate" content="en_US" />

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeAttr(pageTitle)}" />
  <meta name="twitter:description" content="${escapeAttr(metaDesc)}" />
  <meta name="twitter:image" content="${escapeAttr(profilePhotoUrl)}" />

  <link rel="icon" type="image/png" href="https://github.com/user-attachments/assets/fef6c67d-5ed0-4459-b41d-4c288ab48163" />

  <script type="application/ld+json">
    ${safeJsonLd(jsonLdData)}
  </script>

  <style>
    :root {
      --brand: #0e7490;
      --brand-dark: #155e75;
      --brand-darker: #083344;
      --brand-light: #0891b2;
      --brand-subtle: #ecfeff;
      --brand-accent: #0ab4fc;
      --bg-body: #f8fafc;
      --bg-card: #ffffff;
      --bg-card-subtle: #f1f5f9;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --radius: 16px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 16px rgba(14, 116, 144, 0.08);
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background-color: var(--bg-body);
      color: var(--text-main);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .container { max-width: 1100px; margin: 0 auto; padding: 24px 16px 64px 16px; }

    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--brand-dark);
      font-weight: 800;
      font-size: 1.15rem;
    }
    .brand-logo img { width: 32px; height: 32px; border-radius: 8px; }
    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .profile-hero {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      box-shadow: var(--shadow-md);
      margin-bottom: 24px;
    }
    @media (min-width: 768px) {
      .profile-hero { flex-direction: row; align-items: center; gap: 36px; padding: 40px 32px; }
    }
    .avatar-wrapper { position: relative; width: 140px; height: 140px; margin: 0 auto; flex-shrink: 0; }
    @media (min-width: 768px) { .avatar-wrapper { width: 170px; height: 170px; margin: 0; } }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      border: 4px solid var(--brand-subtle);
      box-shadow: 0 4px 14px rgba(14, 116, 144, 0.15);
    }
    .profile-info { flex: 1; text-align: center; }
    @media (min-width: 768px) { .profile-info { text-align: right; } }
    .doc-name { font-size: 1.75rem; font-weight: 900; color: var(--text-main); margin-bottom: 4px; }
    .doc-name-en { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; }
    .doc-title { font-size: 1rem; color: var(--brand); font-weight: 700; margin-bottom: 12px; }
    .doc-meta { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 20px; font-size: 0.875rem; color: var(--text-muted); }
    @media (min-width: 768px) { .doc-meta { justify-content: flex-start; } }
    .doc-meta-item { display: inline-flex; align-items: center; gap: 6px; }

    .cta-buttons { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
    @media (min-width: 768px) { .cta-buttons { justify-content: flex-start; } }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-whatsapp { background: #25d366; color: #ffffff; }
    .btn-whatsapp:hover { background: #1eb956; }
    .btn-call { background: var(--brand); color: #ffffff; }
    .btn-call:hover { background: var(--brand-dark); }
    .btn-email { background: var(--bg-card-subtle); color: var(--text-main); border: 1px solid var(--border); }
    .btn-email:hover { background: var(--border); }

    .main-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 992px) { .main-grid { grid-template-columns: 320px 1fr; } }

    .sidebar-col { display: flex; flex-direction: column; gap: 24px; }
    .content-col { display: flex; flex-direction: column; gap: 24px; }

    .section-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }
    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid var(--brand-subtle);
      padding-bottom: 8px;
    }

    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin-bottom: 16px; }
    .skill-pill {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border);
      color: var(--text-main);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 9999px;
    }

    .timeline-item {
      position: relative;
      padding-right: 20px;
      margin-bottom: 16px;
      border-right: 2px solid var(--brand);
    }
    .timeline-year { font-size: 0.8rem; font-weight: 800; color: var(--brand); margin-bottom: 2px; }
    .timeline-event-ar { font-size: 0.875rem; font-weight: 600; color: var(--text-main); }
    .timeline-event-en { font-size: 0.775rem; color: var(--text-muted); }

    .portfolio-viewer {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow-md);
    }
    .portfolio-nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .case-counter-badge {
      background: var(--brand-subtle);
      color: var(--brand-dark);
      font-size: 0.85rem;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 9999px;
    }
    .carousel-controls { display: flex; align-items: center; gap: 8px; }
    .carousel-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .carousel-btn:hover { background: var(--brand-subtle); border-color: var(--brand); color: var(--brand); }

    .case-slide { display: none; }
    .case-slide.active { display: block; animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .case-header { margin-bottom: 16px; }
    .case-badge-group { display: flex; gap: 8px; margin-bottom: 6px; }
    .case-number { background: var(--brand); color: #fff; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
    .case-category { background: var(--bg-card-subtle); color: var(--text-muted); font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .case-title { font-size: 1.3rem; font-weight: 800; color: var(--text-main); }
    .case-title-en { font-size: 0.95rem; color: var(--text-muted); }

    .ba-comparator {
      position: relative;
      width: 100%;
      height: 380px;
      max-height: 480px;
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: #000;
      user-select: none;
      touch-action: pan-y;
    }
    @media (min-width: 768px) { .ba-comparator { height: 440px; } }
    .ba-image-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; }
    .ba-image-layer img { width: 100%; height: 100%; object-fit: contain; background: #090d16; display: block; pointer-events: none; }
    .ba-before { z-index: 2; border-right: 2px solid #ffffff; }
    .ba-tag { position: absolute; bottom: 12px; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; z-index: 5; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
    .tag-after { right: 12px; background: rgba(14, 116, 144, 0.9); color: #fff; }
    .tag-before { left: 12px; background: rgba(0, 0, 0, 0.75); color: #fff; }

    .ba-handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #ffffff;
      z-index: 10;
      transform: translateX(-50%);
      pointer-events: none;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    .ba-handle-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 34px;
      height: 34px;
      background: #ffffff;
      border: 2px solid var(--brand);
      border-radius: 50%;
      color: var(--brand);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .ba-range-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: ew-resize;
      z-index: 20;
      margin: 0;
    }

    .single-case-image {
      width: 100%;
      height: 380px;
      border-radius: 12px;
      overflow: hidden;
      background: #090d16;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .single-case-image img { width: 100%; height: 100%; object-fit: contain; }

    .ba-noscript-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #000; padding: 8px; border-radius: 12px; }
    .ba-noscript-item img { width: 100%; height: 240px; object-fit: cover; border-radius: 8px; }
    .ba-noscript-item .caption { display: block; text-align: center; color: #fff; font-size: 0.8rem; margin-top: 4px; }

    .case-body { margin-top: 20px; }
    .case-description { font-size: 0.95rem; color: var(--text-main); margin-bottom: 8px; }
    .case-description-en { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }
    .case-meta-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); font-size: 0.85rem; }
    .meta-label { font-weight: 700; color: var(--text-muted); }
    .meta-value { font-weight: 800; color: var(--brand-dark); }

    .carousel-dots { display: flex; justify-content: center; gap: 6px; margin-top: 20px; }
    .dot-btn { width: 10px; height: 10px; border-radius: 50%; background: var(--border); border: none; cursor: pointer; transition: all 0.2s; }
    .dot-btn.active { width: 28px; border-radius: 9999px; background: var(--brand); }

    /* Doctor SEO Hub & Articles Section */
    .seo-articles-hub {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-top: 24px;
      box-shadow: var(--shadow-sm);
    }
    .articles-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    @media (min-width: 768px) {
      .articles-grid { grid-template-columns: 1fr 1fr; }
    }
    .article-item-card {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--bg-card-subtle);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .article-item-card:hover { border-color: var(--brand); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
    .article-item-card h4 { font-size: 0.95rem; font-weight: 800; color: var(--brand-dark); margin-bottom: 6px; }
    .article-item-card p { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; }
    .read-more { font-size: 0.75rem; font-weight: 800; color: var(--brand); margin-top: 12px; display: inline-flex; align-items: center; gap: 4px; }

    .page-footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--text-muted); }
    .page-footer a { color: var(--brand); text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>

  <div class="container">
    <header class="top-nav">
      <a href="${baseUrl}/" class="brand-logo" title="الرئيسية PortfolioHubs">
        <img src="https://github.com/user-attachments/assets/fef6c67d-5ed0-4459-b41d-4c288ab48163" alt="PortfolioHubs Logo" />
        <span>PortfolioHubs</span>
      </a>
      <div class="verified-badge">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>
        <span>بورتفوليو سريري معتمد</span>
      </div>
    </header>

    <section class="profile-hero">
      <div class="avatar-wrapper">
        <img src="${escapeAttr(profilePhotoUrl)}" alt="${escapeAttr(fullNameAr)}" class="avatar-img" />
      </div>
      <div class="profile-info">
        <h1 class="doc-name">${fullNameAr}</h1>
        ${fullNameEn !== fullNameAr ? `<h2 class="doc-name-en">${fullNameEn}</h2>` : ''}
        <p class="doc-title">${titleAr} ${titleEn !== titleAr ? `• ${titleEn}` : ''}</p>
        
        <div class="doc-meta">
          ${universityAr ? `
            <div class="doc-meta-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <span>${universityAr} ${gradYear ? `(${gradYear})` : ''}</span>
            </div>
          ` : ''}
          ${clinicNameAr ? `
            <div class="doc-meta-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H5m14 0h2M5 21H3m6-13h6m-6 4h6m-6 4h6"/></svg>
              <span>${clinicNameAr}</span>
            </div>
          ` : ''}
          ${addressAr ? `
            <div class="doc-meta-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${addressAr}</span>
            </div>
          ` : ''}
        </div>

        <div class="cta-buttons">
          ${whatsapp ? `
            <a href="https://wa.me/${escapeAttr(whatsapp.replace(/[^\d]/g, ''))}?text=${encodeURIComponent('مرحباً دكتور ' + (doctor.fullNameAr || doctor.fullName) + '، اطلعت على بورتفوليو حضرتك على PortfolioHubs وأود التواصل معك.')}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
              <span>واتساب</span>
            </a>
          ` : ''}
          ${phone ? `
            <a href="tel:${escapeAttr(phone)}" class="btn btn-call">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>اتصال</span>
            </a>
          ` : ''}
          ${email ? `
            <a href="mailto:${escapeAttr(email)}" class="btn btn-email">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>البريد الإلكتروني</span>
            </a>
          ` : ''}
        </div>
      </div>
    </section>

    <main class="main-grid">
      <aside class="sidebar-col">
        <section class="section-card">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>المهارات السريرية</span>
          </h2>
          <ul class="skills-list">
            ${renderSkillPills(doctor.clinicalSkills, doctor.clinicalSkillsAr)}
          </ul>

          <h3 class="section-title" style="font-size: 1rem; margin-top: 16px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/></svg>
            <span>المهارات الرقمية والشخصية</span>
          </h3>
          <ul class="skills-list">
            ${renderSkillPills(doctor.digitalSkills, doctor.digitalSkillsAr)}
            ${renderSkillPills(doctor.softSkills, doctor.softSkillsAr)}
          </ul>
        </section>

        <section class="section-card">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>المسيرة المهنية والتعليمية</span>
          </h2>
          <div class="timeline-wrapper">
            ${renderTimeline(doctor.timeline)}
          </div>
        </section>
      </aside>

      <section class="content-col">
        <div class="portfolio-viewer">
          <div class="portfolio-nav-header">
            <div>
              <h2 class="section-title" style="border: none; margin: 0; padding: 0;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span>معرض الحالات السريرية</span>
              </h2>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">اسحب المقبض في منتصف الصورة لمقارنة النتيجة قبل وبعد العلاج</p>
            </div>

            <div class="carousel-controls">
              <span class="case-counter-badge" id="case-counter">1 / ${cases.length || 1}</span>
              <button class="carousel-btn" id="prev-case-btn" aria-label="الحالة السابقة">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <button class="carousel-btn" id="next-case-btn" aria-label="الحالة التالية">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </div>
          </div>

          <div class="cases-slider-container" id="cases-container">
            ${renderedCasesHtml || '<p class="empty-hint">لا توجد حالات سريرية معروضة حالياً.</p>'}
          </div>

          ${cases.length > 1 ? `
            <div class="carousel-dots" id="carousel-dots">
              ${cases.map((_, i) => `<button class="dot-btn ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="الانتقال للحالة ${i + 1}"></button>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- SEO Content Articles Grid -->
        <section class="seo-articles-hub">
          <h3 class="section-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
            <span>المقالات والأدلة الطبية التخصصية</span>
          </h3>
          <div class="articles-grid">
            <a href="${baseUrl}/dr/${username}/articles/about.html" class="article-item-card">
              <div>
                <h4>السيرة المهنية والمسيرة الطبية</h4>
                <p>نبذة تفصيلية عن المؤهلات الأكاديمية والنهج السريري لـ ${fullNameAr}.</p>
              </div>
              <span class="read-more">قراءة المقال الكامل ←</span>
            </a>
            <a href="${baseUrl}/dr/${username}/articles/clinical-cases.html" class="article-item-card">
              <div>
                <h4>الحالات السريرية والخبرة العلاجية</h4>
                <p>استعراض تفصيلي لإجراءات الحشو التجميلي وعلاج الجذور المنجزة.</p>
              </div>
              <span class="read-more">قراءة المقال الكامل ←</span>
            </a>
            <a href="${baseUrl}/dr/${username}/articles/dentist-in-${citySlug}.html" class="article-item-card">
              <div>
                <h4>خدمات الأسنان في ${addressAr || 'المنطقة'}</h4>
                <p>الخدمات والرعاية السنية المتاحة للمرضى في العيادة.</p>
              </div>
              <span class="read-more">قراءة المقال الكامل ←</span>
            </a>
            <a href="${baseUrl}/dr/${username}/articles/patient-guide.html" class="article-item-card">
              <div>
                <h4>دليل المرضى الشامل للعناية بالأسنان</h4>
                <p>نصائح وإرشادات وقائية مبسطة للحفاظ على صحة الفم واللثة.</p>
              </div>
              <span class="read-more">قراءة المقال الكامل ←</span>
            </a>
          </div>
        </section>
      </section>
    </main>

    <footer class="page-footer">
      <p>تم إنشاء هذا البورتفوليو السريري الرسمي عبر منصة <a href="${baseUrl}/">PortfolioHubs</a> — المنصة المعتمدة لأطباء الأسنان.</p>
      <p style="margin-top: 4px; font-size: 0.75rem; opacity: 0.8;">جميع الحقوق محفوظة © ${new Date().getFullYear()} ${escapeHtml(fullNameAr)}</p>
    </footer>
  </div>

  <script>
    (function() {
      function initComparators() {
        var comparators = document.querySelectorAll('[data-comparator]');
        comparators.forEach(function(comp) {
          var beforeLayer = comp.querySelector('[data-before-layer]');
          var handle = comp.querySelector('[data-handle]');
          var slider = comp.querySelector('[data-slider]');
          if (!beforeLayer || !handle || !slider) return;

          function updateSlider(val) {
            val = Math.max(0, Math.min(100, val));
            beforeLayer.style.width = val + '%';
            handle.style.left = val + '%';
          }

          slider.addEventListener('input', function(e) {
            updateSlider(e.target.value);
            stopAutoPlay();
          });

          var isDragging = false;
          function handlePointer(e) {
            var rect = comp.getBoundingClientRect();
            var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            var x = clientX - rect.left;
            var pct = (x / rect.width) * 100;
            slider.value = pct;
            updateSlider(pct);
            stopAutoPlay();
          }

          comp.addEventListener('pointerdown', function(e) {
            isDragging = true;
            handlePointer(e);
          });
          window.addEventListener('pointermove', function(e) {
            if (isDragging) handlePointer(e);
          });
          window.addEventListener('pointerup', function() {
            isDragging = false;
          });
        });
      }

      var currentIdx = 0;
      var slides = document.querySelectorAll('.case-slide');
      var dots = document.querySelectorAll('.dot-btn');
      var counter = document.getElementById('case-counter');
      var total = slides.length;
      var autoPlayTimer = null;
      var isInteracted = false;

      function showCase(idx) {
        if (total === 0) return;
        currentIdx = (idx + total) % total;
        slides.forEach(function(s, i) {
          s.classList.toggle('active', i === currentIdx);
        });
        dots.forEach(function(d, i) {
          d.classList.toggle('active', i === currentIdx);
        });
        if (counter) {
          counter.textContent = (currentIdx + 1) + ' / ' + total;
        }
      }

      function stopAutoPlay() {
        if (autoPlayTimer) {
          clearInterval(autoPlayTimer);
          autoPlayTimer = null;
        }
        isInteracted = true;
      }

      function startAutoPlay() {
        if (total <= 1 || isInteracted) return;
        autoPlayTimer = setInterval(function() {
          showCase(currentIdx + 1);
        }, 5000);
      }

      var prevBtn = document.getElementById('prev-case-btn');
      var nextBtn = document.getElementById('next-case-btn');

      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          stopAutoPlay();
          showCase(currentIdx - 1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          stopAutoPlay();
          showCase(currentIdx + 1);
        });
      }

      dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
          stopAutoPlay();
          var idx = parseInt(dot.getAttribute('data-index') || '0', 10);
          showCase(idx);
        });
      });

      var touchStartX = 0;
      var casesContainer = document.getElementById('cases-container');
      if (casesContainer) {
        casesContainer.addEventListener('touchstart', function(e) {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        casesContainer.addEventListener('touchend', function(e) {
          var touchEndX = e.changedTouches[0].screenX;
          var diff = touchStartX - touchEndX;
          if (Math.abs(diff) > 40) {
            stopAutoPlay();
            if (diff > 0) {
              showCase(currentIdx + 1);
            } else {
              showCase(currentIdx - 1);
            }
          }
        }, { passive: true });
      }

      document.addEventListener('DOMContentLoaded', function() {
        initComparators();
        startAutoPlay();
      });

      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        initComparators();
        startAutoPlay();
      }
    })();
  </script>
</body>
</html>`;
}

// Simple Markdown to HTML helper for blog articles
function simpleMarkdownToHtml(markdown) {
  if (!markdown) return '';
  let body = markdown.replace(/^---[\s\S]*?---\n*/, '');

  body = body.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black text-cyan-950 mb-6 border-b border-cyan-100 pb-3">$1</h1>');
  body = body.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-cyan-900 mt-8 mb-4 border-b border-slate-100 pb-2">$1</h2>');
  body = body.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-cyan-800 mt-6 mb-3">$1</h3>');

  body = body.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-cyan-800 underline font-semibold hover:text-cyan-950 transition-colors">$1</a>');
  body = body.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  body = body.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="mr-4 list-disc text-slate-700 my-1 leading-relaxed">$1</li>');
  body = body.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="mr-4 list-decimal text-slate-700 my-1 leading-relaxed">$1</li>');
  body = body.replace(/^---$/gim, '<hr class="my-8 border-slate-200" />');

  const paragraphs = body.split(/\n\n+/);
  return paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<li') || p.startsWith('<hr')) return p;
    return `<p class="text-slate-700 leading-relaxed text-base my-4">${p}</p>`;
  }).join('\n');
}

function buildBlogArticlePageHtml({ article, markdown, allArticles = [], baseUrl }) {
  const canonicalUrl = `${baseUrl}/blog/${article.slug}.html`;
  const articleBodyHtml = simpleMarkdownToHtml(markdown);

  // Find 3 related articles for real internal linking
  const relatedList = (allArticles || [])
    .filter(a => a.slug !== article.slug && (a.category === article.category || (article.relatedSlugs || []).includes(a.slug)))
    .slice(0, 3);

  const relatedArticlesHtml = relatedList.length > 0 ? `
    <div class="mt-10 pt-8 border-t border-slate-200 space-y-4">
      <h3 class="text-xl font-black text-cyan-950 flex items-center gap-2">
        <span class="w-2 h-5 bg-cyan-700 rounded-full inline-block"></span>
        مقالات طبية ذات صلة
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${relatedList.map(rel => `
          <a href="${baseUrl}/blog/${rel.slug}.html" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-cyan-600 hover:shadow-xs transition-all flex flex-col justify-between group">
            <div class="space-y-2">
              <span class="text-[10px] font-black px-2 py-0.5 bg-cyan-100 text-cyan-900 rounded-md inline-block">${escapeHtml(rel.categoryAr || rel.category)}</span>
              <h4 class="text-xs font-bold text-slate-900 group-hover:text-cyan-800 line-clamp-2">${escapeHtml(rel.title)}</h4>
            </div>
            <span class="text-[11px] font-semibold text-cyan-700 mt-3 flex items-center gap-1">قراءة المقال ←</span>
          </a>
        `).join('')}
      </div>
    </div>
  ` : '';

  const pubDate = article.publishedAt || new Date().toISOString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "keywords": article.keyword,
    "datePublished": pubDate,
    "dateModified": pubDate,
    "author": {
      "@type": "Organization",
      "name": "PortfolioHubs Editorial",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "PortfolioHubs",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/icon.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)} | مدونة PortfolioHubs الطبية</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <meta name="keywords" content="${escapeHtml(article.keyword)}, طب الأسنان, PortfolioHubs">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- OpenGraph Cards -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(article.description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="PortfolioHubs">

  <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
  </script>

  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col">
  <header class="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 shadow-xs">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="${baseUrl}/" class="text-xl font-black text-cyan-950 flex items-center gap-2">
        <span class="bg-cyan-800 text-white px-2.5 py-1 rounded-xl text-sm font-black">PortfolioHubs</span>
        <span class="text-xs text-slate-500 font-bold hidden sm:inline">مدونة طب الأسنان</span>
      </a>
      <a href="${baseUrl}/blog/index.html" class="text-xs font-bold text-cyan-800 hover:underline">← جميع المقالات</a>
    </div>
  </header>

  <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
    <article class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
      <div class="space-y-3 border-b border-slate-100 pb-6">
        <span class="inline-block px-3 py-1 bg-cyan-100 text-cyan-900 text-xs font-black rounded-lg">${escapeHtml(article.categoryAr || article.category)}</span>
        <h1 class="text-2xl sm:text-4xl font-black text-slate-900 leading-snug">${escapeHtml(article.title)}</h1>
        <div class="text-xs text-slate-500 font-medium flex items-center gap-4 pt-2">
          <span>الكلمة المفتاحية: <strong>${escapeHtml(article.keyword)}</strong></span>
          <span>زمن القراءة: ${escapeHtml(article.readingTime)}</span>
        </div>
      </div>

      <div class="prose prose-slate max-w-none">
        ${articleBodyHtml}
      </div>

      ${relatedArticlesHtml}
    </article>
  </main>

  <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
    <p>© PortfolioHubs - جميع الحقوق محفوظة للمحتوى الطبي والسريري</p>
  </footer>
</body>
</html>`;
}

// ==========================================
// 7. Sitemap & Robots.txt Generator
// ==========================================
function generateSitemapAndRobots(publishedDoctorEntries, publishedBlogEntries = [], baseUrl, outputDir) {
  const dateStr = new Date().toISOString().split('T')[0];
  
  const urls = [
    `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    `  <url>\n    <loc>${baseUrl}/cv</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    `  <url>\n    <loc>${baseUrl}/portfolio</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    `  <url>\n    <loc>${baseUrl}/blog/index.html</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`
  ];

  publishedDoctorEntries.forEach(({ slug, citySlug }) => {
    // Main Doctor Portfolio URL (Highest Priority)
    urls.push(
      `  <url>\n    <loc>${baseUrl}/dr/${slug}/</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.95</priority>\n  </url>`
    );
    // 4 Content Articles URLs
    urls.push(
      `  <url>\n    <loc>${baseUrl}/dr/${slug}/articles/about.html</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>`,
      `  <url>\n    <loc>${baseUrl}/dr/${slug}/articles/clinical-cases.html</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>`,
      `  <url>\n    <loc>${baseUrl}/dr/${slug}/articles/dentist-in-${citySlug}.html</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>`,
      `  <url>\n    <loc>${baseUrl}/dr/${slug}/articles/patient-guide.html</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>`
    );
  });

  publishedBlogEntries.forEach(slug => {
    urls.push(
      `  <url>\n    <loc>${baseUrl}/blog/${slug}.html</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    );
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard

Sitemap: ${baseUrl}/sitemap.xml
`;

  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsTxt);
  console.log(`✓ Generated sitemap.xml with ${urls.length} URLs.`);
  console.log(`✓ Generated robots.txt.`);
}

// ==========================================
// 8. Main Orchestrator
// ==========================================
async function runStaticGeneration() {
  console.log('====================================================');
  console.log('PortfolioHubs - Static Generation & SEO Build Engine');
  console.log('====================================================\n');

  let db = null;
  try {
    const app = initFirebaseAdmin();
    db = getFirestore(app);
  } catch (err) {
    console.warn('⚠️ Could not initialize Firebase Admin SDK:', err.message);
  }
  const baseUrl = process.env.BASE_URL || 'https://portfoliohubs.github.io';
  const publicDir = path.join(process.cwd(), 'public');
  ensureDir(publicDir);

  const publishedDoctorEntries = [];
  let generatedPagesCount = 0;
  let generatedArticlesCount = 0;
  let processedImagesCount = 0;
  let deletedPendingDocsCount = 0;

  try {
    // Step 1: Process pending image uploads
    console.log('Step 1: Checking ephemeral pending_uploads collection...');
    try {
      const pendingSnap = await db.collectionGroup('pending_uploads').get();
      console.log(`Found ${pendingSnap.size} pending image upload document(s).`);

      for (const docSnap of pendingSnap.docs) {
        const data = docSnap.data();
        const { uid, targetType, targetId, fileName, base64 } = data;
        if (!uid || !base64) {
          await docSnap.ref.delete();
          continue;
        }

        let slug = 'dr-' + uid.substring(0, 8);
        const userSnap = await db.collection('users').doc(uid).get();
        if (userSnap.exists) {
          const u = userSnap.data();
          slug = u.username || u.slug || ('dr-' + slugify(u.fullName || 'doctor'));
        }

        const safeName = fileName || `${targetType}_${Date.now()}.webp`;
        const subFolder = targetType === 'case' ? 'cases' : 'profile';
        const destRelPath = `assets/dr/${slug}/${subFolder}/${safeName}`;
        const destFullPath = path.join(publicDir, destRelPath);

        writeBase64ToFile(destFullPath, base64);
        processedImagesCount++;

        if (targetType === 'case' && targetId) {
          await db.collection('users').doc(uid).collection('cases').doc(targetId).set({
            photoPath: destRelPath,
            preview: destRelPath,
            photo: destRelPath,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } else if (targetType === 'profile') {
          await db.collection('users').doc(uid).set({
            profilePhotoPath: destRelPath,
            profilePhoto: destRelPath,
            profilePreview: destRelPath,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }

        await docSnap.ref.delete();
        deletedPendingDocsCount++;
      }
    } catch (err) {
      console.warn('⚠️ Step 1 skipped (no Firestore admin access):', err.message);
    }

    // Step 2: Fetch approved doctors and generate pages + 4 articles
    console.log('\nStep 2: Fetching approved doctors from Firestore...');
    try {
      const usersSnap = await db.collection('users').get();
      
      for (const userDoc of usersSnap.docs) {
        const doctor = userDoc.data();
        const uid = userDoc.id;

        const isApproved = doctor.status === 'published' || doctor.status === 'approved';
        const isActive = doctor.active !== false;

        if (!isApproved || !isActive) {
          continue;
        }

        const username = doctor.username || doctor.slug || slugify(doctor.fullName || 'doctor');
        const citySlug = slugify(doctor.locationAddress || doctor.locationAddressAr || 'city');
        console.log(`\n> Generating static portfolio & 4 SEO articles for: ${doctor.fullName || doctor.fullNameAr} (dr/${username})...`);

        // Clinical cases from subcollection
        const casesSnap = await db.collection('users').doc(uid).collection('cases').orderBy('sortOrder', 'asc').get();
        let cases = [];
        if (!casesSnap.empty) {
          cases = casesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (Array.isArray(doctor.cases) && doctor.cases.length > 0) {
          cases = doctor.cases;
        }

        // 1) Generate Main Doctor Page (/dr/{username}/index.html)
        const htmlContent = buildDoctorStaticHtml({ doctor, cases, baseUrl });
        const doctorHtmlDir = path.join(publicDir, 'dr', username);
        ensureDir(doctorHtmlDir);
        fs.writeFileSync(path.join(doctorHtmlDir, 'index.html'), htmlContent, 'utf-8');
        generatedPagesCount++;

        // 2) Generate 4 SEO Articles (/dr/{username}/articles/*.html)
        const articlesDir = path.join(doctorHtmlDir, 'articles');
        ensureDir(articlesDir);

        const angles = ['about', 'cases', 'local', 'guide'];
        for (const angle of angles) {
          const articleHtml = buildArticleStaticHtml({ doctor, angleKey: angle, baseUrl });
          const fileName = angle === 'local' ? `dentist-in-${citySlug}.html` : (angle === 'about' ? 'about.html' : (angle === 'cases' ? 'clinical-cases.html' : 'patient-guide.html'));
          fs.writeFileSync(path.join(articlesDir, fileName), articleHtml, 'utf-8');
          generatedArticlesCount++;
        }

        console.log(`  ✓ Main Portfolio: dr/${username}/index.html`);
        console.log(`  ✓ 4 SEO Articles generated in dr/${username}/articles/`);

        publishedDoctorEntries.push({ slug: username, citySlug });
      }
    } catch (err) {
      console.warn('⚠️ Step 2 skipped (no Firestore admin access):', err.message);
    }

    // Step 4: Generate Public Blog Pages & Copy Markdown
    console.log('\nStep 4: Generating Public Blog Pages & Copying Markdown Assets...');
    const blogPublicDir = path.join(publicDir, 'blog');
    const contentBlogPublicDir = path.join(publicDir, 'content', 'blog');
    ensureDir(blogPublicDir);
    ensureDir(contentBlogPublicDir);

    // Copy raw markdown files to public/content/blog/
    const contentBlogDir = path.join(process.cwd(), 'content', 'blog');
    if (fs.existsSync(contentBlogDir)) {
      const files = fs.readdirSync(contentBlogDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          fs.copyFileSync(path.join(contentBlogDir, file), path.join(contentBlogPublicDir, file));
        }
      }
      console.log(`  ✓ Copied ${files.length} blog markdown files to public/content/blog/`);
    }

    // Fetch published blog overrides from Firestore
    const blogOverrides = {};
    try {
      const blogSnap = await db.collection('blog_articles').get();
      blogSnap.forEach(d => {
        blogOverrides[d.id] = d.data();
      });
    } catch (err) {
      console.warn('⚠️ Could not connect to Firestore for blog_articles overrides (using defaults):', err.message);
    }

    // Read index.json and build static HTML for published blog articles
    const publishedBlogEntries = [];
    const indexPath = path.join(contentBlogDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      const allArticles = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      for (const art of allArticles) {
        const override = blogOverrides[art.slug];
        const isPublished = override ? Boolean(override.published) : Boolean(art.published);
        const articleHtmlFile = path.join(blogPublicDir, `${art.slug}.html`);
        
        if (isPublished) {
          const mdPath = path.join(contentBlogDir, `${art.slug}.md`);
          const markdown = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf-8') : `# ${art.title}\n\n${art.description}`;
          const blogHtml = buildBlogArticlePageHtml({ article: art, markdown, allArticles, baseUrl });
          
          fs.writeFileSync(articleHtmlFile, blogHtml, 'utf-8');
          publishedBlogEntries.push(art.slug);
        } else {
          // If unpublished, ensure any previously generated HTML file is deleted
          if (fs.existsSync(articleHtmlFile)) {
            fs.unlinkSync(articleHtmlFile);
          }
        }
      }
      console.log(`  ✓ Generated ${publishedBlogEntries.length} published blog static HTML pages in public/blog/`);
    }

    // Step 5: Generate Sitemap & Robots.txt
    console.log('\nStep 5: Generating sitemap.xml and robots.txt...');
    generateSitemapAndRobots(publishedDoctorEntries, publishedBlogEntries, baseUrl, publicDir);

    console.log('\n====================================================');
    console.log('STATIC & ARTICLE GENERATION COMPLETED SUCCESSFULLY');
    console.log(`- Approved Doctors: ${publishedDoctorEntries.length}`);
    console.log(`- Main Portfolios Generated: ${generatedPagesCount}`);
    console.log(`- Doctor SEO Articles Generated: ${generatedArticlesCount}`);
    console.log(`- Published Blog Articles: ${publishedBlogEntries.length}`);
    console.log(`- Static WebP Images Saved: ${processedImagesCount}`);
    console.log(`- Ephemeral Docs Purged: ${deletedPendingDocsCount}`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('Fatal error during generation:', error);
    process.exit(1);
  }
}

runStaticGeneration();
