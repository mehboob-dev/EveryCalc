/**
 * Shares text via Web Share API or falls back to WhatsApp Web/App and Clipboard.
 */
export function shareText(text: string, title: string = 'EveryCalc'): void {
  const cleanText = text.trim();
  const encoded = encodeURIComponent(cleanText);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

  if (navigator.share) {
    navigator
      .share({
        title,
        text: cleanText
      })
      .catch(() => {
        window.open(whatsappUrl, '_blank');
      });
  } else {
    // Attempt copying to clipboard, then open WhatsApp
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanText).catch(() => {});
    }
    window.open(whatsappUrl, '_blank');
  }
}
