import { ChatIcon } from './Icon';

export default function WhatsAppButton({ service, country, className = '' }) {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '';
  const lines = [
    'Hello, I would like to discuss a website/design project.',
    '',
    `Service: ${service || ''}`,
    `Country: ${country || ''}`,
  ];
  const text = encodeURIComponent(lines.join('\n'));
  const href = number ? `https://wa.me/${number}?text=${text}` : '#';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <ChatIcon className="h-4 w-4 text-jade" />
      Discuss your project on WhatsApp
    </a>
  );
}
