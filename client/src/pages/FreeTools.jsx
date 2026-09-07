import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import GradientText from '../components/common/GradientText';
import WhatsAppButton from '../components/common/WhatsAppButton';
import { useCountry } from '../context/CountryContext';
import {
  CheckMarkIcon,
  XCircleIcon,
  WarningIcon,
  TagIcon,
  PaletteIcon,
  CreditCardIcon,
  RulerIcon,
} from '../components/common/Icon';

/**
 * 1. Interactive Meta Tag Generator
 */
function MetaTagGenerator() {
  const [title, setTitle] = useState('My Awesome Product — Next Gen Web Experience');
  const [description, setDescription] = useState('Build, scale, and launch lightning fast web applications with transparent pricing.');
  const [url, setUrl] = useState('https://mywebsite.com');
  const [image, setImage] = useState('https://mywebsite.com/og-image.jpg');
  const [copied, setCopied] = useState(false);

  const metaCode = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${url}" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${description}" />
<meta property="twitter:image" content="${image}" />`;

  const copyCode = () => {
    navigator.clipboard.writeText(metaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
            Page Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
            Meta Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
              Canonical URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
              OG Image URL
            </label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Code Preview & Social Card Mockup */}
      <div className="space-y-4">
        {/* Social Card Preview */}
        <div className="rounded-2xl border border-ink/10 bg-white dark:bg-white/5 p-4 shadow-sm">
          <p className="text-xs font-mono text-muted-light mb-2">Google & Social Search Preview</p>
          <p className="text-xs text-emerald-700 truncate">{url}</p>
          <h4 className="text-sm font-semibold text-signal hover:underline cursor-pointer truncate mt-0.5">
            {title}
          </h4>
          <p className="text-xs text-muted-light line-clamp-2 mt-1">{description}</p>
        </div>

        {/* Code Box */}
        <div className="relative rounded-2xl bg-[#12141C] p-4 text-white font-mono text-xs overflow-x-auto max-h-56">
          <button
            type="button"
            onClick={copyCode}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-signal transition-colors"
          >
            {copied ? (
              <>
                <CheckMarkIcon className="h-3 w-3" />
                <span>Copied</span>
              </>
            ) : (
              'Copy HTML'
            )}
          </button>
          <pre className="text-white/80">{metaCode}</pre>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Color Contrast & Accessibility Checker
 */
function ColorContrastChecker() {
  const [textColor, setTextColor] = useState('#12141C');
  const [bgColor, setBgColor] = useState('#FFFFFF');

  // Relative luminance calculation
  const getLuminance = (hex) => {
    const rgb = hex.replace('#', '').match(/.{1,2}/g).map((v) => {
      const val = parseInt(v, 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const getContrastRatio = () => {
    try {
      const l1 = getLuminance(textColor);
      const l2 = getLuminance(bgColor);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      return Math.round(ratio * 100) / 100;
    } catch {
      return 4.5;
    }
  };

  const ratio = getContrastRatio();
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7.0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
            Text Color (Hex)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-10 w-12 rounded-lg cursor-pointer border border-ink/15"
            />
            <input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-mono focus:border-signal focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
            Background Color (Hex)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-10 w-12 rounded-lg cursor-pointer border border-ink/15"
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-mono focus:border-signal focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Swatches */}
        <div className="pt-2">
          <p className="text-xs font-mono text-muted-light mb-2">Preset Combinations</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => { setTextColor('#12141C'); setBgColor('#FFFFFF'); }}
              className="rounded-lg border border-ink/10 px-3 py-1 hover:bg-black/5"
            >
              Ink on White
            </button>
            <button
              onClick={() => { setTextColor('#FFFFFF'); setBgColor('#12141C'); }}
              className="rounded-lg border border-ink/10 px-3 py-1 hover:bg-black/5"
            >
              White on Ink
            </button>
            <button
              onClick={() => { setTextColor('#FFFFFF'); setBgColor('#22C55E'); }}
              className="rounded-lg border border-ink/10 px-3 py-1 hover:bg-black/5"
            >
              White on Signal Blue
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Box & WCAG Status */}
      <div className="space-y-4">
        <div
          className="rounded-3xl p-6 border border-ink/10 shadow-sm transition-all duration-300 flex flex-col justify-between min-h-[160px]"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          <div>
            <h4 className="font-display text-xl font-bold">Contrast Sample Heading</h4>
            <p className="text-sm mt-1 opacity-90 leading-relaxed">
              Design for all users. High contrast ensures readability in various lighting conditions.
            </p>
          </div>
          <span className="font-mono text-xs font-bold mt-4">
            Ratio: {ratio}:1
          </span>
        </div>

        {/* WCAG Compliance Badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl p-4 border ${passesAA ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
            <p className="font-mono text-xs font-bold">WCAG AA Standard (4.5:1)</p>
            <p className="flex items-center gap-1.5 text-sm font-semibold mt-1">
              {passesAA ? (
                <>
                  <CheckMarkIcon className="h-3.5 w-3.5" />
                  <span>Passed (Normal Text)</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-3.5 w-3.5" />
                  <span>Failed</span>
                </>
              )}
            </p>
          </div>
          <div className={`rounded-2xl p-4 border ${passesAAA ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <p className="font-mono text-xs font-bold">WCAG AAA Enhanced (7.0:1)</p>
            <p className="flex items-center gap-1.5 text-sm font-semibold mt-1">
              {passesAAA ? (
                <>
                  <CheckMarkIcon className="h-3.5 w-3.5" />
                  <span>Passed (Optimal)</span>
                </>
              ) : (
                <>
                  <WarningIcon className="h-3.5 w-3.5" />
                  <span>Notice (Acceptable for Large Text)</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. 50% Milestone & Project Splitter
 */
function MilestoneSplitter() {
  const { country } = useCountry();
  const [budget, setBudget] = useState(1500);
  const [currency, setCurrency] = useState(country === 'Sri Lanka' ? 'LKR' : 'USD');

  const advance = Math.round(budget * 0.5);
  const remaining = budget - advance;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
            Total Project Budget
          </label>
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-3 py-2.5 text-sm font-mono"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AUD">AUD ($)</option>
              <option value="LKR">LKR (Rs)</option>
              <option value="CAD">CAD ($)</option>
            </select>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-mono font-bold focus:border-signal focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 border border-ink/10 dark:border-white/10 text-xs text-muted-light space-y-2">
          <p className="font-semibold text-ink">Why the 50/50 Milestone Model?</p>
          <p>
            • <strong>50% Initial Advance:</strong> Secures engineering resources, infrastructure setup, and design sprint allocation.
          </p>
          <p>
            • <strong>50% Final Settlement:</strong> Invoiced only after interactive staging review and approval before DNS/code handover.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-white/5 p-6 border border-signal/20 shadow-sm space-y-4">
        <h4 className="font-display font-bold text-lg text-ink">Milestone Breakdown</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-200">
            <div>
              <span className="font-mono text-xs font-bold text-emerald-800 uppercase">Phase 1: Deposit</span>
              <p className="text-xs text-emerald-700">50% Advance to start sprint</p>
            </div>
            <p className="font-mono text-xl font-bold text-emerald-600">
              {currency} {advance.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-paper p-4 border border-ink/10">
            <div>
              <span className="font-mono text-xs font-bold text-ink uppercase">Phase 2: Final Handover</span>
              <p className="text-xs text-muted-light">50% Balance on completion</p>
            </div>
            <p className="font-mono text-xl font-bold text-ink">
              {currency} {remaining.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border-t border-ink/10 pt-4 flex items-center justify-between">
          <span className="text-xs text-muted-light">Total Project Value:</span>
          <span className="font-mono text-lg font-bold text-signal">
            {currency} {budget.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Responsive Viewport Aspect Ratio Calculator
 */
function AspectRatioCalculator() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);

  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height) || 1;
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
              Width (px)
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-mono font-bold focus:border-signal focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1">
              Height (px)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-ink/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-mono font-bold focus:border-signal focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => { setWidth(1920); setHeight(1080); }}
            className="rounded-lg border border-ink/10 px-3 py-1 bg-white dark:bg-white/5 hover:bg-black/5 font-mono"
          >
            16:9 (Desktop 1080p)
          </button>
          <button
            onClick={() => { setWidth(1440); setHeight(900); }}
            className="rounded-lg border border-ink/10 px-3 py-1 bg-white dark:bg-white/5 hover:bg-black/5 font-mono"
          >
            16:10 (MacBook)
          </button>
          <button
            onClick={() => { setWidth(390); setHeight(844); }}
            className="rounded-lg border border-ink/10 px-3 py-1 bg-white dark:bg-white/5 hover:bg-black/5 font-mono"
          >
            9:19.5 (iPhone)
          </button>
          <button
            onClick={() => { setWidth(1080); setHeight(1080); }}
            className="rounded-lg border border-ink/10 px-3 py-1 bg-white dark:bg-white/5 hover:bg-black/5 font-mono"
          >
            1:1 (Square)
          </button>
        </div>
      </div>

      {/* Visual aspect ratio container */}
      <div className="rounded-3xl glass-card p-6 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-3xl font-bold text-signal">
          {ratioW}:{ratioH}
        </span>
        <span className="text-xs text-muted-light mt-1 font-mono">
          CSS aspect-ratio: {width}/{height} ({(width / height).toFixed(2)})
        </span>

        <div
          className="mt-6 max-h-36 max-w-full rounded-xl bg-signal/15 border-2 border-dashed border-signal flex items-center justify-center text-xs font-mono text-signal"
          style={{
            aspectRatio: `${width} / ${height}`,
            width: width >= height ? '100%' : 'auto',
            height: height > width ? '140px' : 'auto',
          }}
        >
          {width} × {height}
        </div>
      </div>
    </div>
  );
}

export default function FreeTools() {
  const [activeTool, setActiveTool] = useState('meta');

  const tools = [
    { id: 'meta', name: 'Meta & OpenGraph Generator', icon: TagIcon, desc: 'Create SEO title, description, and social share cards.' },
    { id: 'contrast', name: 'Color Contrast Checker', icon: PaletteIcon, desc: 'Verify WCAG AA / AAA compliance for your brand palette.' },
    { id: 'milestone', name: '50% Milestone Calculator', icon: CreditCardIcon, desc: 'Calculate project deposit splits and milestone payments.' },
    { id: 'aspect', name: 'Aspect Ratio & Viewport Tool', icon: RulerIcon, desc: 'Find aspect ratios and CSS responsive parameters.' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Free Utility Tools"
        title="Web design & developer"
        gradientWord="free tools"
        description="A collection of complimentary utilities crafted by Web_Sole to streamline your digital product development, SEO metadata, and design workflows."
      />

      {/* Tool Selector Tabs */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTool(t.id)}
            className={`flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 ${
              activeTool === t.id
                ? 'bg-signal text-white shadow-lg shadow-signal/25 scale-[1.02]'
                : 'glass-card text-ink hover:border-signal/30'
            }`}
          >
            <span className="mb-2"><t.icon className="h-6 w-6" /></span>
            <span className="font-display font-semibold text-xs sm:text-sm leading-tight">
              {t.name}
            </span>
          </button>
        ))}
      </div>

      {/* Active Tool Interactive Container */}
      <Reveal className="mt-8 rounded-3xl glass-card p-6 sm:p-10 shadow-lg border border-ink/10">
        <div className="border-b border-ink/10 pb-4 mb-6">
          <h3 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            {(() => {
              const ActiveIcon = tools.find((t) => t.id === activeTool)?.icon;
              return ActiveIcon ? <ActiveIcon className="h-5 w-5" /> : null;
            })()}
            <span>{tools.find((t) => t.id === activeTool)?.name}</span>
          </h3>
          <p className="text-xs text-muted-light mt-1">
            {tools.find((t) => t.id === activeTool)?.desc}
          </p>
        </div>

        {activeTool === 'meta' && <MetaTagGenerator />}
        {activeTool === 'contrast' && <ColorContrastChecker />}
        {activeTool === 'milestone' && <MilestoneSplitter />}
        {activeTool === 'aspect' && <AspectRatioCalculator />}
      </Reveal>

      {/* Callout */}
      <section className="mt-16 text-center rounded-3xl glass-dark p-8 sm:p-10 text-white">
        <h3 className="font-display text-2xl font-bold text-white">
          Need a custom software tool or web platform?
        </h3>
        <p className="mt-2 text-sm text-white/70 max-w-md mx-auto">
          We build bespoke web apps, APIs, client portals, and design systems with transparent pricing.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/pricing"
            className="rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white hover:bg-signal-deep transition-all"
          >
            Explore Rates
          </Link>
          <WhatsAppButton className="bg-white/10 text-white hover:bg-white/20 border border-white/20" />
        </div>
      </section>
    </div>
  );
}
