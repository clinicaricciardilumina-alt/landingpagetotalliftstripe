/* ═══════════════════════════════════════════════
   pixel.js — Meta Pixel tracking
   Ricciardi Studio Dermistico · Total Lift

   Eventi tracciati:
   - PageView
   - ClickPrenotazione
   - QuestionarioCompletato
   - Lead
   - SlotSelected
   - InitiateCheckout
   - Purchase
═══════════════════════════════════════════════ */

function initPixel() {
  const pid = TL.cfg().pixelId;
  if (!pid) return;

  /* Carica SDK Facebook solo se non già presente */
  if (!window.fbq) {
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;
      n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  }

  fbq('init', pid);
  fbq('track', 'PageView');
}

function trackEvent(name, params = {}) {
  const pid = TL.cfg().pixelId;
  if (!pid) return;
  if (window.fbq) {
    fbq('track', name, params);
  }
}
