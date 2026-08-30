import { useState, useEffect } from 'react';
import { Loader2, Star, CheckCircle2, Copy, ExternalLink, MapPin, ChefHat } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CVTdiL14ejNdEAE/review';

type FormState = {
  food: string;
  enjoyedMost: string;
  customText: string;
  service: string;
  recommend: string;
};

function App() {
  const [form, setForm] = useState<FormState>({
    food: '',
    enjoyedMost: '',
    customText: '',
    service: '',
    recommend: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState('');
  const [copied, setCopied] = useState(false);
  const [clipboardError, setClipboardError] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Parse query params to allow showing QR
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('qr')) {
      setShowQR(true);
    }
  }, []);

  const handleSelect = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!form.customText) {
      setError('Please tell us what you ordered or enjoyed.');
      return;
    }
    if (!form.food || !form.enjoyedMost || !form.service || !form.recommend) {
      setError('Please answer all questions to help us write a great review.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // For local development with wrangler, API will be on the same origin /api/...
      // In production, it will also be same origin.
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error(res.status === 429 ? 'Please try again in a moment.' : 'Something went wrong while creating your review.');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setReview(data.review);
      
      // Attempt copy
      try {
        await navigator.clipboard.writeText(data.review);
        setCopied(true);
      } catch (err) {
        setClipboardError(true);
      }
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong while creating your review.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCopy = async () => {
    try {
      await navigator.clipboard.writeText(review);
      setCopied(true);
      setClipboardError(false);
    } catch (err) {
      setClipboardError(true);
    }
  };

  if (showQR) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full flex flex-col items-center text-center">
          <ChefHat className="w-12 h-12 text-amber-600 mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">MEGHAM QR Code</h1>
          <p className="text-neutral-500 mb-8">Scan to share your experience</p>
          
          <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm mb-8">
            <QRCodeSVG 
              value={window.location.origin} 
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"Q"}
              includeMargin={false}
            />
          </div>
          
          <button 
            onClick={() => setShowQR(false)}
            className="text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
          >
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-24 selection:bg-amber-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 pt-12 pb-6 px-6 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
            <ChefHat className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MEGHAM</h1>
          <div className="flex items-center text-sm text-neutral-500 mt-1">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Restaurant &bull; Haridwar
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 relative mb-6">
              <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-amber-500 text-white rounded-full p-4 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Creating your review...</h2>
            <p className="text-neutral-500">Our AI is putting your experience into words.</p>
          </div>
        ) : review ? (
          <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8 pt-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your review is ready</h2>
              {copied ? (
                <p className="text-green-600 font-medium">✓ Copied to clipboard</p>
              ) : clipboardError ? (
                <p className="text-amber-600 font-medium">Review created. Tap COPY REVIEW to copy it.</p>
              ) : null}
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 border border-neutral-100 relative">
              <div className="absolute -top-3 left-6">
                <div className="flex gap-1 bg-white px-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className="text-neutral-700 text-lg leading-relaxed pt-2">"{review}"</p>
            </div>

            <div className="space-y-4">
              <p className="text-center text-neutral-500 text-sm mb-6">
                {copied ? "Paste it on Google and share your experience." : "Copy the text above and share it on Google."}
              </p>
              
              <a 
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 text-white font-semibold text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20"
              >
                GO TO GOOGLE REVIEWS <ExternalLink className="w-5 h-5" />
              </a>

              <button 
                onClick={handleManualCopy}
                className="w-full bg-white text-neutral-700 border-2 border-neutral-200 font-semibold text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-50 active:scale-[0.98] transition-all"
              >
                {copied ? '✓ COPIED' : 'COPY REVIEW'} <Copy className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => {
                  setReview('');
                  setCopied(false);
                  setClipboardError(false);
                }}
                className="w-full mt-8 text-neutral-400 font-medium hover:text-neutral-600 py-4"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-10 pt-4">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">Share your experience <span className="text-red-500">❤️</span></h2>
              <p className="text-neutral-500 text-lg leading-relaxed">Tell us what you enjoyed and we'll help you put it into words.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 flex items-start gap-3 border border-red-100">
                <div className="mt-0.5">⚠️</div>
                <div>{error}</div>
              </div>
            )}

            <div className="space-y-12">
              {/* Question 1 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm flex items-center justify-center">1</span>
                  How was the food?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Excellent', 'Very Good', 'Good', 'Average'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelect('food', opt)}
                      className={`p-4 rounded-2xl text-left border-2 transition-all font-medium ${
                        form.food === opt 
                          ? 'border-amber-500 bg-amber-50 text-amber-900' 
                          : 'border-neutral-100 bg-white hover:border-neutral-200 text-neutral-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>

              {/* Question 2 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm flex items-center justify-center">2</span>
                  What did you enjoy most?
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['Food', 'Ambience', 'Service', 'Desserts', 'Overall experience'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelect('enjoyedMost', opt)}
                      className={`px-5 py-3 rounded-full text-sm border-2 transition-all font-medium ${
                        form.enjoyedMost === opt 
                          ? 'border-amber-500 bg-amber-50 text-amber-900' 
                          : 'border-neutral-100 bg-white hover:border-neutral-200 text-neutral-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>

              {/* Question 3 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm flex items-center justify-center">3</span>
                  What did you order or enjoy?
                </h3>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Gulab Jamun Tiramisu"
                  value={form.customText}
                  onChange={(e) => handleSelect('customText', e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-neutral-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-lg"
                />
              </section>

              {/* Question 4 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm flex items-center justify-center">4</span>
                  How was the service?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Excellent', 'Very Good', 'Good', 'Average'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelect('service', opt)}
                      className={`p-4 rounded-2xl text-left border-2 transition-all font-medium ${
                        form.service === opt 
                          ? 'border-amber-500 bg-amber-50 text-amber-900' 
                          : 'border-neutral-100 bg-white hover:border-neutral-200 text-neutral-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>

              {/* Question 5 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm flex items-center justify-center">5</span>
                  Would you recommend us?
                </h3>
                <div className="flex gap-3">
                  {['Definitely', 'Probably', 'Maybe'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelect('recommend', opt)}
                      className={`flex-1 py-3 px-2 rounded-2xl text-center text-sm border-2 transition-all font-medium ${
                        form.recommend === opt 
                          ? 'border-amber-500 bg-amber-50 text-amber-900' 
                          : 'border-neutral-100 bg-white hover:border-neutral-200 text-neutral-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-12 mb-12">
              <button
                onClick={handleGenerate}
                className="w-full bg-neutral-900 text-white font-semibold text-lg py-5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xl shadow-neutral-900/20"
              >
                CREATE MY REVIEW
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
