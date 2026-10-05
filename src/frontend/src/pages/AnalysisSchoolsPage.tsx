import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CandlestickChart,
  Compass,
  Crosshair,
  Gauge,
  GraduationCap,
  Layers,
  LineChart,
  type LucideIcon,
  Ruler,
  Target,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useMemo } from "react";

/** A single technical-analysis school reference entry. */
interface School {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  definition: string;
  principles: string[];
  tools: string[];
  whenToUse: string[];
  /** Indicator ids available on the analysis page that relate to this school. */
  indicators: IndicatorId[];
}

type IndicatorId = "sma" | "rsi" | "macd";

const INDICATOR_LABELS: Record<IndicatorId, string> = {
  sma: "المتوسط المتحرك (SMA)",
  rsi: "مؤشر القوة النسبية (RSI)",
  macd: "تقارب وتباعد المتوسطات (MACD)",
};

const SCHOOLS: School[] = [
  {
    id: "classical",
    name: "التحليل الكلاسيكي",
    tagline: "الاتجاه والدعم والمقاومة والنماذج السعرية",
    icon: CandlestickChart,
    definition:
      "أقدم مدارس التحليل الفني وأكثرها انتشاراً، وتقوم على قراءة حركة السعر نفسها عبر دراسة الاتجاهات ومستويات الدعم والمقاومة والنماذج السعرية المتكررة، دون الاعتماد على مؤشرات مشتقة.",
    principles: [
      "السعر يتحرك في اتجاهات: صاعد، هابط، أو عرضي، والاتجاه يستمر حتى يثبت العكس.",
      "الدعم منطقة يتوقف عندها الهبوط، والمقاومة منطقة يتوقف عندها الصعود، ودور كل منهما ينقلب عند الاختراق.",
      "النماذج السعرية مثل الرأس والكتفين والمثلثات والقنوات تعكس توازن العرض والطلب وتتنبأ بامتداد الحركة.",
      "حجم التداول يؤكد صحة الاختراقات ويضعف مصداقية الاختراقات الوهمية.",
    ],
    tools: [
      "خطوط الاتجاه والقنوات السعرية",
      "مستويات الدعم والمقاومة الأفقية",
      "النماذج السعرية (الرأس والكتفين، المثلثات، الأعلام)",
      "الشموع اليابانية وأنماطها الانعكاسية",
    ],
    whenToUse: [
      "عند تحديد الاتجاه العام قبل الدخول في أي صفقة.",
      "لتحديد نقاط الدخول والخروج عند اقتراب السعر من مستويات مفصلية.",
      "في الأسواق ذات السيولة العالية التي تحترم المستويات التاريخية.",
    ],
    indicators: ["sma"],
  },
  {
    id: "harmonic",
    name: "أنماط الهارمونيك",
    tagline: "جارتلي، الفراشة، الخفاش، السلطعون",
    icon: Waves,
    definition:
      "مدرسة تعتمد على نسب فيبوناتشي الهندسية لتحديد أنماط سعرية انعكاسية دقيقة، حيث تتناسب أضلاع الحركة بنسب محددة مسبقاً لتشكّل مناطق انعكاس محتملة عالية الاحتمالية.",
    principles: [
      "الحركة السعرية تتكرر في أنماط هندسية يمكن قياسها بنسب فيبوناتشي.",
      "كل نمط يتكون من أضلاع (XABCD) بنسب تصحيح وامتداد محددة تحدد نقطة الانعكاس.",
      "منطقة التقاء النسب (PRZ) هي منطقة الدخول المحتملة مع وقف قريب.",
      "النمط يفقد صلاحيته إذا تجاوز السعر نقطة X أو كسر النسب المسموحة.",
    ],
    tools: [
      "أداة تصحيح وامتداد فيبوناتشي",
      "أنماط جارتلي والفراشة والخفاش والسلطعون",
      "مناطق الانعكاس المحتملة (PRZ)",
      "التقاء الهارمونيك مع مستويات الدعم والمقاومة",
    ],
    whenToUse: [
      "عند البحث عن نقاط انعكاس دقيقة بنسبة مخاطرة إلى عائد مرتفعة.",
      "في الأسواق التي تُظهر تصحيحات منتظمة تحترم نسب فيبوناتشي.",
      "لتأكيد إشارات الانعكاس القادمة من مدارس أخرى.",
    ],
    indicators: ["rsi"],
  },
  {
    id: "elliott",
    name: "موجات إليوت",
    tagline: "بنية الموجات الدافعة والتصحيحية",
    icon: TrendingUp,
    definition:
      "مدرسة تفسّر حركة السوق كدورات نفسية جماعية تتشكل في موجات متكررة؛ خمس موجات دافعة في اتجاه الترند وثلاث موجات تصحيحية عكسها، مع تداخل الموجات على مستويات زمنية متعددة.",
    principles: [
      "الترند يتكون من خمس موجات دافعة (1-2-3-4-5) تليها ثلاث موجات تصحيحية (A-B-C).",
      "الموجة الثالثة هي الأطول والأقوى عادةً ولا تكون الأقصر بين الموجات الدافعة.",
      "الموجة الرابعة لا تتداخل مع منطقة الموجة الأولى في الأنماط القياسية.",
      "الأنماط تتكرر بشكل فركتالي على جميع الأطر الزمنية.",
    ],
    tools: [
      "ترقيم الموجات على الأطر الزمنية المتعددة",
      "نسب فيبوناتشي لتقدير أطوال الموجات",
      "القنوات السعرية لتأكيد بنية الموجة",
      "مؤشرات الزخم لتأكيد انتهاء الموجة",
    ],
    whenToUse: [
      "عند محاولة تحديد موقع السوق داخل دورة أكبر لتوقع الاتجاه القادم.",
      "لتحديد أهداف سعرية محتملة لنهاية الموجة الدافعة.",
      "في الأسواق ذات الدورات الواضحة والاتجاهات الممتدة.",
    ],
    indicators: ["macd", "rsi"],
  },
  {
    id: "price-action",
    name: "برايس أكشن",
    tagline: "قراءة السعر العارية دون مؤشرات",
    icon: Activity,
    definition:
      "مدرسة تعتمد على قراءة حركة السعر الخام وحدها عبر الشموع والبنية السعرية، دون أي مؤشرات مشتقة، بهدف فهم سلوك المشترين والبائعين في اللحظة الراهنة.",
    principles: [
      "السعر هو المصدر الوحيد للحقيقة، وكل ما عداه مشتق ومتأخر.",
      "بنية السوق (قمم وقيعان أعلى أو أدنى) تحدد الاتجاه.",
      "الشموع الانعكاسية مثل المطرقة والابتلاع تعكس تغيّر توازن القوى.",
      "مناطق العرض والطلب هي محركات الحركة الحقيقية.",
    ],
    tools: [
      "أنماط الشموع اليابانية",
      "بنية السوق (Market Structure)",
      "مناطق العرض والطلب",
      "خطوط الاتجاه والاختراقات الكاذبة",
    ],
    whenToUse: [
      "للمتداولين الذين يفضلون الشارت النظيف دون تشويش المؤشرات.",
      "في الأطر الزمنية القصيرة حيث تكون سرعة القرار حاسمة.",
      "لتأكيد إشارات المؤشرات بقراءة سلوك السعر الفعلي.",
    ],
    indicators: [],
  },
  {
    id: "gann",
    name: "تحليل جان",
    tagline: "الزمن والسعر والزوايا الهندسية",
    icon: Compass,
    definition:
      "منهج يجمع بين الزمن والسعر عبر أدوات هندسية ورياضية، ويرى أن للسوق دورات زمنية منتظمة تتقاطع مع مستويات سعرية محددة لتحديد نقاط الانعكاس.",
    principles: [
      "الزمن والسعر عاملان متساويان في الأهمية، وتقاطعهما يصنع الانعكاس.",
      "الزوايا الهندسية (45 درجة ومضاعفاتها) تعبّر عن سرعة الاتجاه.",
      "مربعات الزمن والدورات الزمنية تتكرر بأنماط قابلة للقياس.",
      "مستويات جان السعرية تعمل كدعم ومقاومة رياضية.",
    ],
    tools: [
      "زوايا جان ومروحة جان",
      "مربع التسعة ودائرة 360 درجة",
      "خطوط الزمن ودوراتها",
      "مستويات جان السعرية",
    ],
    whenToUse: [
      "لتحديد تواريخ انعكاس محتملة بناءً على دورات زمنية.",
      "في الأسواق التي تُظهر احتراماً لمستويات رياضية متكررة.",
      "كمكمل للتحليل الكلاسيكي لتأكيد توقيت الدخول.",
    ],
    indicators: ["sma"],
  },
  {
    id: "wyckoff",
    name: "منهج وايكوف",
    tagline: "التراكم والتصريف وسلوك المؤسسات",
    icon: Layers,
    definition:
      "منهج يفسّر حركة السوق عبر مراحل التراكم والتصريف، ويركّز على تتبع أثر المؤسسات الكبرى من خلال العلاقة بين السعر والحجم لاقتناص الصفقات قبل الجمهور.",
    principles: [
      "السوق يمر بثلاث مراحل: التراكم، الصعود، ثم التصريف.",
      "الحجم يكشف نوايا المؤسسات؛ الحجم المرتفع عند الدعم يشير إلى تراكم.",
      "اختبار العرض والطلب (Spring و Upthrust) يكشف الفخاخ قبل الحركة الكبرى.",
      'التداول مع "اليد الذكية" بدل مطاردة الحركة اللاحقة.',
    ],
    tools: [
      "مخططات السعر والحجم المركّبة",
      "مفاهيم Spring و Upthrust و Test",
      "مناطق التراكم والتصريف",
      "تحليل الفارق بين العرض والطلب",
    ],
    whenToUse: [
      "لتحديد مناطق دخول مبكرة قبل انطلاق الحركة الكبرى.",
      "في الأسواق التي تُظهر تذبذباً جانبياً طويلاً قبل الانفجار السعري.",
      "لفهم سلوك المؤسسات في الأسهم ذات السيولة العالية.",
    ],
    indicators: ["sma", "rsi"],
  },
  {
    id: "volume",
    name: "التحليل الحجمي",
    tagline: "حجم التداول كمحرك للسعر",
    icon: BarChart3,
    definition:
      "مدرسة تضع حجم التداول في مركز التحليل، باعتباره مقياساً لقوة المشاركة وصدق الحركة السعرية، وتستخدمه لتأكيد الاتجاهات وكشف الانعكاسات المبكرة.",
    principles: [
      "الحجم يسبق السعر؛ تغيّر الحجم ينبئ بتغيّر محتمل في الاتجاه.",
      "الاختراق المصحوب بحجم مرتفع أكثر مصداقية من الاختراق بحجم ضعيف.",
      "تباعد السعر والحجم (Divergence) إشارة تحذيرية للانعكاس.",
      "الحجم المرتفع عند القمم قد يشير إلى تصريف، وعند القيعان إلى تراكم.",
    ],
    tools: [
      "أعمدة الحجم ومتوسط الحجم",
      "مؤشرات تدفق السيولة (Money Flow)",
      "تحليل تباعد السعر والحجم",
      "مؤشرات الحجم النسبي",
    ],
    whenToUse: [
      "لتأكيد صحة الاختراقات قبل الدخول.",
      "لكشف الانعكاسات المبكرة عند القمم والقيعان.",
      "في الأسواق ذات السيولة العالية حيث يكون الحجم ذا دلالة.",
    ],
    indicators: ["sma"],
  },
  {
    id: "indicators",
    name: "المؤشرات الفنية",
    tagline: "المتوسطات والزخم والتذبذب",
    icon: Gauge,
    definition:
      "مدرسة تعتمد على مؤشرات رياضية مشتقة من السعر والحجم لتبسيط قراءة الاتجاه والزخم والتشبع، وتُستخدم عادةً كأدوات تأكيد إلى جانب قراءة السعر.",
    principles: [
      "المؤشرات مشتقة من السعر، لذا فهي متأخرة بطبيعتها وتُستخدم للتأكيد لا للتنبؤ.",
      "المتوسطات المتحركة تحدد الاتجاه وتعمل كدعم ومقاومة متحركة.",
      "مؤشرات الزخم مثل RSI تكشف التشبع الشرائي والبيعي.",
      "تقاطعات MACD تعكس تحوّلات الزخم وتغيّر الاتجاه قصير المدى.",
    ],
    tools: [
      "المتوسطات المتحركة البسيطة والأسية (SMA/EMA)",
      "مؤشر القوة النسبية (RSI)",
      "تقارب وتباعد المتوسطات (MACD)",
      "مؤشرات التذبذب مثل Stochastic و Bollinger Bands",
    ],
    whenToUse: [
      "لتأكيد إشارات الاتجاه القادمة من التحليل الكلاسيكي أو برايس أكشن.",
      "لتحديد مناطق التشبع الشرائي والبيعي قبل الانعكاس.",
      "في الأسواق العرضية لاقتناص التذبذبات بين الحدين.",
    ],
    indicators: ["sma", "rsi", "macd"],
  },
];

const DEFAULT_SCHOOL_ID = SCHOOLS[0].id;

function isSchoolId(value: unknown): value is string {
  return typeof value === "string" && SCHOOLS.some((s) => s.id === value);
}

export function AnalysisSchoolsPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { school?: string };
  const activeId = isSchoolId(search.school)
    ? search.school
    : DEFAULT_SCHOOL_ID;
  const active = useMemo(
    () => SCHOOLS.find((s) => s.id === activeId) ?? SCHOOLS[0],
    [activeId],
  );

  function selectSchool(id: string) {
    void navigate({ to: "/schools", search: { school: id } });
  }

  const ActiveIcon = active.icon;

  return (
    <div className="container py-8 md:py-12" data-ocid="schools.page">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
          <GraduationCap className="size-4" aria-hidden="true" />
          مرجع التحليل الفني
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          مدارس التحليل
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          دليل مرجعي لمدارس التحليل الفني ومناهجها — من الكلاسيكية إلى الحديثة.
          اختر مدرسة من القائمة لعرض تعريفها ومبادئها وأدواتها ومواضع استخدامها.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ── Side navigation between schools ────────────────────────── */}
        <nav
          aria-label="مدارس التحليل"
          data-ocid="schools.nav"
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SCHOOLS.map((school) => {
              const isActive = school.id === activeId;
              const Icon = school.icon;
              return (
                <li key={school.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    data-ocid={`schools.nav.item.${school.id}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => selectSchool(school.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-right transition-smooth",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-foreground shadow-subtle"
                        : "border-border bg-card text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md transition-smooth",
                        isActive
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {school.name}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {school.tagline}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Active school detail ───────────────────────────────────── */}
        <article
          key={active.id}
          data-ocid={`schools.detail.${active.id}`}
          className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-subtle sm:p-7"
        >
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow-primary">
                <ActiveIcon className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  {active.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {active.tagline}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="w-fit shrink-0 border-accent/40 text-accent"
            >
              مدرسة تحليل فني
            </Badge>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Section
              icon={Compass}
              title="التعريف"
              ocid={`schools.definition.${active.id}`}
            >
              <p className="text-sm leading-7 text-muted-foreground">
                {active.definition}
              </p>
            </Section>

            <Section
              icon={Target}
              title="المبادئ الأساسية"
              ocid={`schools.principles.${active.id}`}
            >
              <ul className="flex flex-col gap-2.5">
                {active.principles.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              icon={Ruler}
              title="الأدوات المستخدمة"
              ocid={`schools.tools.${active.id}`}
            >
              <ul className="flex flex-wrap gap-2">
                {active.tools.map((tool) => (
                  <li key={tool}>
                    <Badge
                      variant="secondary"
                      className="rounded-md px-2.5 py-1 text-xs font-medium"
                    >
                      {tool}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              icon={Crosshair}
              title="متى تُستخدم"
              ocid={`schools.when.${active.id}`}
            >
              <ul className="flex flex-col gap-2.5">
                {active.whenToUse.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {active.indicators.length > 0 && (
            <div
              data-ocid={`schools.indicators.${active.id}`}
              className="mt-6 rounded-lg border border-border bg-secondary/30 p-4"
            >
              <div className="flex items-center gap-2">
                <LineChart className="size-4 text-accent" aria-hidden="true" />
                <h3 className="font-display text-sm font-bold text-foreground">
                  مؤشرات ذات صلة على صفحة التحليل
                </h3>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {active.indicators.map((indicator) => (
                  <li key={indicator}>
                    <Link
                      to="/"
                      data-ocid={`schools.indicator_link.${indicator}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:border-accent/50 hover:text-accent"
                    >
                      <Activity className="size-3.5" aria-hidden="true" />
                      {INDICATOR_LABELS[indicator]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  ocid,
  children,
}: {
  icon: LucideIcon;
  title: string;
  ocid: string;
  children: React.ReactNode;
}) {
  return (
    <section data-ocid={ocid} className="min-w-0">
      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export default AnalysisSchoolsPage;
