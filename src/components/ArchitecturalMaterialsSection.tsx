import React, { useState } from 'react';
import {
  Trees,
  Sparkles,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Award,
  Layers,
  Truck,
  Wrench
} from 'lucide-react';

interface MaterialPillar {
  id: string;
  number: string;
  title: string;
  categoryName: string;
  subtitle: string;
  quote: string;
  image: string;
  highlights: {
    title: string;
    description: string;
    metric: string;
  }[];
  hotspots: {
    x: number; // percentage from right
    y: number; // percentage from top
    label: string;
    detail: string;
  }[];
}

const MATERIAL_PILLARS: MaterialPillar[] = [
  {
    id: 'wood',
    number: '01',
    title: 'خشب الزان والبلوط الطبيعي المصمت',
    categoryName: 'الهيكل والنجارة المعمارية',
    subtitle: 'أخشاب غابات معتمدة مجففة حرارياً لمقاومة الرطوبة والتمدد مدى الحياة',
    quote: '«نختار جذوع الزان والبلوط ذات الألياف الكثيفة، ونعالجها في أفران حرارية بنسبة رطوبة محددة لضمان ألا تتأثر بتقلبات الطقس.»',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=1200&auto=format&fit=crop&q=80',
    highlights: [
      {
        title: 'تجفيف فرن حراري Kiln-Dried',
        description: 'تثبيت نسبة الرطوبة بين 8% و10% لمنع تقوس أو انكماش الخشب تماماً.',
        metric: '8-10% رطوبة',
      },
      {
        title: 'تعشيق ميكانيكي Mortise & Tenon',
        description: 'وصلات نجارة معمارية متشابكة توفر أقصى ثبات هيكلي دون الاعتماد على براغٍ ضعيفة.',
        metric: 'تعشيق مضاعف',
      },
      {
        title: 'طلاء بولي يوريثان إيطالي',
        description: 'طبقات حماية شفافة مسامية تبرز جمال العروق الطبيعية وتقاوم خدوش الاستخدام اليومي.',
        metric: '3 طبقات حماية',
      },
    ],
    hotspots: [
      { x: 30, y: 35, label: 'عروق البلوط الطبيعية', detail: 'ألياف خشبية متراصة ومحمية بدهان ناعم الملمس' },
      { x: 70, y: 65, label: 'قاعدة الزان الصلبة', detail: 'هيكل مصمت يدعم كامل وزن الأريكة دون أي انحناء' },
    ],
  },
  {
    id: 'fabrics',
    number: '02',
    title: 'الأقمشة الفاخرة والبوكليه العازل',
    categoryName: 'التنجيد والراحة اليومية',
    subtitle: 'أنسجة أوروبية راقية معالجة بتقنية حماية السوائل وإسفنج عالي المرونة',
    quote: '«الراحة الحقيقية تبدأ من ملمس القماش ونوعية الحشو؛ نستخدم أقمشة تمنحك إحساس الفخامة وسهولة فائقة في تنظيف أي انسكاب عارض.»',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
    highlights: [
      {
        title: 'حماية Nano-Shield من البقع',
        description: 'طبقة مجهرية تمنع امتصاص السوائل كالشاي والقهوة، وتجعل التنظيف بقطعة قماش مبللة فورياً.',
        metric: 'عازل 100% للسوائل',
      },
      {
        title: 'إسفنج D30 / D35 عالي الكثافة',
        description: 'قلب إسفنجي طبي مرن مدعم بألياف داكرون ويايات زنبركية تحافظ على استقامة الجلسة لسنوات.',
        metric: 'كثافة D35 ممتازة',
      },
      {
        title: 'اختبار مارتنديل للمتانة',
        description: 'تجاوزت أنسجتنا 45,000 دورة احتكاك لضمان عدم اهتراء القماش أو تغير لونه.',
        metric: '+45,000 دورة',
      },
    ],
    hotspots: [
      { x: 45, y: 40, label: 'نسيج البوكليه الدائري', detail: 'خيوط معزولة تمنح دفئاً فائقاً ومقاومة للتنسل' },
      { x: 60, y: 75, label: 'توزيع الحشو الداخلي', detail: 'طبقات متدرجة من الإسفنج عالي المرونة للراحة القصوى' },
    ],
  },
  {
    id: 'metal',
    number: '03',
    title: 'المعادن المعمارية والإكسسوارات الهندسية',
    categoryName: 'الدقة والمتانة الميكانيكية',
    subtitle: 'إكسسوارات ومسارات هيدروليكية صامتة وهياكل فولاذية مطلية حرارياً',
    quote: '«التفاصيل الخفية هي التي تدوم؛ مفصلات ناعمة الإغلاق ومقابض نحاسية مصقولة لا يتغير بريقها مع السنين.»',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    highlights: [
      {
        title: 'مفصلات Soft-Close صامتة',
        description: 'مسارات ومكابس هيدروليكية ألمانية تضمن إغلاقاً سلساً وهادئاً دون أدنى ارتطام.',
        metric: 'إغلاق هيدروليكي صامت',
      },
      {
        title: 'طلاء كهروستاتيكي حراري',
        description: 'معالجة سطحية في أفران البودرة لحماية القواعد والأرجل الفولاذية من التآكل والرطوبة.',
        metric: 'مقاوم للصدأ 100%',
      },
      {
        title: 'تحمل أوزان تفوق 400 كغ',
        description: 'هياكل مدعمة بحسابات إجهاد ميكانيكي تمنح القطعة ثباتاً فائقاً واتزاناً تاماً.',
        metric: 'أحمال +400 كغ',
      },
    ],
    hotspots: [
      { x: 50, y: 55, label: 'أرجل فولاذية مدمجة', detail: 'قواعد مصمتة مطلية بالبودرة الحرارية المقاومة للخدوش' },
    ],
  },
  {
    id: 'warranty',
    number: '04',
    title: 'ميثاق الجودة وضمان الثقة المعتمد',
    categoryName: 'الالتزام وخدمة ما بعد البيع',
    subtitle: 'ضمان هيكلي رسمي لمدة 5 سنوات، ومعاينة حقيقية في 3 معارض، وتوصيل لكافة الولايات',
    quote: '«اسمنا هو التزامنا؛ نضمن كل قطعة أثاث تخرج من ورشنا بوثيقة رسمية ومتابعة مستمرة لراحة بالك الكاملة.»',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80',
    highlights: [
      {
        title: 'ضمان هيكلي لمدة 5 سنوات',
        description: 'تغطية شاملة لأي عيب مصنعي في الهيكل الخشبي أو المسارات الميكانيكية.',
        metric: 'ضمان رسمي 5 سنوات',
      },
      {
        title: 'معاينة واقعية في 3 فروع',
        description: 'يمكنكم لمس الخامات واختبار الراحة شخصياً في فروعنا بالجزائر والبليدة وسطيف.',
        metric: '3 صالات عرض',
      },
      {
        title: 'توصيل وتركيب محترف لـ 58 ولاية',
        description: 'أسطول نقل متخصص وفريق تركيب خبير يسلّم القطعة جاهزة تماماً في منزلك.',
        metric: '58 ولاية جزائرية',
      },
    ],
    hotspots: [
      { x: 35, y: 50, label: 'ختم مطابقة الجودة', detail: 'فحص ثلاثي المراحل قبل التغليف والشحن' },
    ],
  },
];

export const ArchitecturalMaterialsSection: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<string>('wood');
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  const activePillar = MATERIAL_PILLARS.find((p) => p.id === activeTabId) || MATERIAL_PILLARS[0];

  return (
    <section
      id="guarantees"
      className="scroll-mt-24 bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs"
      aria-labelledby="materials-heading"
    >
      {/* Top Header: Editorial Magazine Tag */}
      <div className="p-6 sm:p-10 lg:p-12 border-b border-neutral-100 bg-neutral-50/50 reveal-fade-up">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#FF551A] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
            <span>معايير الثقة · رحلة الحرفية والخامات المعمارية</span>
          </div>
          <h2
            id="materials-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E1E1E] tracking-tight leading-tight"
          >
            خامات أصيلة تُبنى لتدوم، وتفاصيل تحكي فخامة كل زاوية
          </h2>
          <p className="text-neutral-600 text-xs sm:text-sm lg:text-base leading-relaxed">
            في أثاث الثقة، نعتبر الخامات أساس العمل المعماري الراقي. نجمع بين الأخشاب الطبيعية الصلبة والأنسجة المعالجة وأحدث تقنيات الإغلاق الهيدروليكي لنقدم قطعاً تتوارثها الأجيال.
          </p>
        </div>

        {/* Material Switcher Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 pt-2 border-t border-neutral-200/70">
          {MATERIAL_PILLARS.map((pillar) => {
            const isActive = pillar.id === activeTabId;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => {
                  setActiveTabId(pillar.id);
                  setActiveHotspot(null);
                }}
                className={`group px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#1E1E1E] text-white shadow-md'
                    : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200/80'
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-[#FF551A] text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {pillar.number}
                </span>
                <span>{pillar.title.split(' ')[0]} {pillar.title.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Editorial Showcase Canvas */}
      <div className="p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Visual Showcase with Interactive Hotspots (Curtain Clip Reveal) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-lg group aspect-[4/3] sm:aspect-[16/11]">
              <img
                key={activePillar.id}
                src={activePillar.image}
                alt={activePillar.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-104 reveal-image-curtain is-revealed"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Pillar Number & Category Stamp */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-white flex items-center gap-2 text-xs font-mono">
                <span className="text-[#FF551A] font-bold">{activePillar.number}</span>
                <span className="text-neutral-300">/</span>
                <span className="text-[11px] font-sans font-medium text-neutral-200">
                  {activePillar.categoryName}
                </span>
              </div>

              {/* Interactive Visual Hotspots */}
              {activePillar.hotspots.map((spot, idx) => {
                const isSelected = activeHotspot === idx;
                return (
                  <div
                    key={idx}
                    style={{ right: `${spot.x}%`, top: `${spot.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveHotspot(isSelected ? null : idx)}
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-transform duration-200 ${
                        isSelected ? 'scale-115' : 'hover:scale-110'
                      }`}
                      aria-label={spot.label}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF551A] opacity-70" />
                      <span className="relative inline-flex items-center justify-center rounded-full h-7 w-7 bg-white text-[#1E1E1E] border-2 border-[#FF551A] shadow-lg text-[11px] font-bold">
                        +
                      </span>
                    </button>

                    {/* Hotspot Floating Tooltip */}
                    {isSelected && (
                      <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-52 sm:w-60 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-neutral-200 shadow-xl text-right animate-in fade-in zoom-in-95 duration-150 z-30">
                        <span className="text-[10px] font-bold text-[#FF551A] block">ميزة فنية</span>
                        <h5 className="text-xs font-bold text-[#1E1E1E] mt-0.5">{spot.label}</h5>
                        <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{spot.detail}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Quote Banner Over Image */}
              <div className="absolute bottom-4 right-4 left-4 sm:right-6 sm:left-6 text-white text-xs sm:text-sm font-medium leading-relaxed bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="italic text-neutral-200 font-serif">{activePillar.quote}</p>
              </div>
            </div>
          </div>

          {/* Specifications & Architectural Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#FF551A] tracking-wider uppercase">
                {activePillar.categoryName}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] leading-snug">
                {activePillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {activePillar.subtitle}
              </p>
            </div>

            {/* 3 Detailed Quality Highlights */}
            <div className="space-y-3.5 pt-2">
              {activePillar.highlights.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-100/50 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#FF551A] shrink-0" />
                      <h4 className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
                        {item.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 shrink-0">
                      {item.metric}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 pr-6 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Quality Seal Strip */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
              <div className="flex items-center gap-2 font-bold text-[#1E1E1E]">
                <Award className="w-4 h-4 text-[#FF551A]" />
                <span>معتمد وموثّق لدى أثاث الثقة</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                ISO & CRAFT STANDARDS
              </span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
