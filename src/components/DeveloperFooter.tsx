import React from 'react';
import { ExternalLink } from 'lucide-react';

export const DeveloperFooter: React.FC = () => {
  const handleFacebookClick = () => {
    const webUrl = 'https://www.facebook.com/share/1SpsS3PwaE/';
    const appUrl = 'fb://facewebmodal/f?href=https://www.facebook.com/share/1SpsS3PwaE/';

    // Try app URI scheme first, fallback to browser
    const start = Date.now();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);
      if (Date.now() - start < 1500) {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
    }, 500);
  };

  return (
    <footer
      id="developer-branding-footer"
      className="w-full max-w-md mx-auto py-8 px-6 text-center border-t border-slate-900/60 mt-auto"
    >
      <div className="flex flex-col items-center justify-center space-y-1.5">
        <p className="text-xs font-medium tracking-wide text-slate-400">
          Developer — <span className="text-slate-200 font-semibold">Tasnim Hasan</span>
        </p>

        <button
          id="btn-follow-facebook"
          onClick={handleFacebookClick}
          type="button"
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors py-1 px-3 rounded-full hover:bg-red-500/10 active:scale-95 transition-transform"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Follow on Facebook</span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>

        <p className="text-[10px] text-slate-500 pt-1">
          WakeGuard v2.4 • Shielding sleep & focus
        </p>
      </div>
    </footer>
  );
};
