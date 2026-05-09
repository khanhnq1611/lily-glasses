import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shirt, Sparkles, Upload, Loader2, CheckCircle2, ShoppingCart, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { GLASSES_LIST, GlassesStyle } from '../constants/glasses';
import { generateContent } from '../lib/openrouterApi';

interface OutfitMatchCardProps {
  onSelectGlasses: (glasses: GlassesStyle) => void;
}

export const OutfitMatchCard: React.FC<OutfitMatchCardProps> = ({ onSelectGlasses }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    vibe: string;
    colors: string[];
    recommendedIds: string[];
    reasoning: string;
  } | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        analyzeOutfit(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

   const analyzeOutfit = async (imageData: string) => {
     setIsAnalyzing(true);
     try {
       const prompt = `
         Bạn là một stylist thời trang chuyên nghiệp. Phân tích outfit trong ảnh và gợi ý 2 mã ID kính phù hợp từ:
         ${GLASSES_LIST.map(g => `- ID: ${g.id}, Name: ${g.name}, Type: ${g.type}`).join('\n')}

        Trả về JSON: { "vibe": string, "colors": string[], "recommendedIds": string[], "reasoning": string }
        `;

        const response = await generateContent({
          model: "gpt-4-turbo",
          contents: {
            parts: [
              {
                inlineData: {
                  data: imageData.split(',')[1],
                  mimeType: "image/jpeg"
                }
              },
              {
                text: prompt
              }
            ]
          } as any,
        });

       try {
         // Extract JSON from response
         const jsonMatch = response.text.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
           const data = JSON.parse(jsonMatch[0]);
           setSuggestions(data);
         }
       } catch (parseError) {
         console.error("Failed to parse AI response:", parseError);
       }
     } catch (error) {
       console.error("Analysis failed:", error);
     } finally {
       setIsAnalyzing(false);
     }
   };

  return (
    <div className="bg-white rounded-[2.5rem] border border-lily-green/10 shadow-2xl overflow-hidden">
      <div className="bg-lily-green px-8 py-6 text-white relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl italic leading-none">Phối đồ cùng AI</h3>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 mt-1.5 font-bold">Styling with Outfit</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {!image ? (
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-lily-green/10 rounded-[2rem] p-12 flex flex-col items-center justify-center transition-all group-hover:border-lily-green/30 group-hover:bg-lily-green/5">
              <div className="w-16 h-16 bg-lily-green/5 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-8 h-8 text-lily-green/40" />
              </div>
              <p className="text-sm font-bold text-lily-green">Tải lên outfit của bạn</p>
              <p className="text-[10px] text-lily-green/40 uppercase tracking-widest mt-2">ẢNH CẢ NGƯỜI HOẶC TRANG PHỤC</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-32 h-40 rounded-2xl overflow-hidden border border-lily-green/10 shadow-lg relative shrink-0">
                <img src={image} className="w-full h-full object-cover" alt="Outfit" />
                <button 
                  onClick={() => { setImage(null); setSuggestions(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 space-y-4">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col justify-center gap-3">
                    <div className="flex items-center gap-2 text-lily-green font-bold text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang phân tích layout màu sắc...
                    </div>
                    <div className="w-full bg-lily-green/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full bg-lily-green"
                      />
                    </div>
                  </div>
                ) : suggestions && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-lily-green/30 uppercase tracking-widest mb-1">Phong cách nhận diện</h4>
                      <p className="text-xl font-serif font-bold text-lily-green font-italic italic">{suggestions.vibe}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.colors.map((c, i) => (
                        <span key={i} className="px-3 py-1 bg-lily-beige rounded-lg text-[10px] font-bold text-lily-green/60 border border-lily-green/5">
                          {c}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {suggestions && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-6 border-t border-lily-green/5"
              >
                <div>
                  <h4 className="text-[10px] font-bold text-lily-green/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-lily-green/60" /> Đề xuất dành riêng cho bạn
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {suggestions.recommendedIds.map(id => {
                      const glass = GLASSES_LIST.find(g => g.id === id);
                      if (!glass) return null;
                      return (
                        <button 
                          key={id}
                          onClick={() => onSelectGlasses(glass)}
                          className="group relative bg-lily-beige border border-lily-green/5 rounded-3xl p-4 text-left transition-all hover:bg-white hover:border-lily-green/20 hover:shadow-xl"
                        >
                          <div className="w-full aspect-square bg-white rounded-2xl mb-3 overflow-hidden flex items-center justify-center p-4">
                            <div className="w-full h-12 bg-lily-green/10 rounded-full flex items-center justify-center relative group-hover:bg-lily-green transition-colors">
                               <div className="absolute inset-x-0 h-0.5 bg-lily-green/20 group-hover:bg-white/30" />
                               <div className="w-8 h-8 rounded-full border-2 border-lily-green/20 group-hover:border-white/40 z-10" />
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-lily-green/40 uppercase tracking-widest mb-1">{glass.type}</p>
                          <p className="text-xs font-bold text-lily-green leading-tight">{glass.name}</p>
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4 text-lily-green" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-lily-green/5 rounded-[2rem] p-6 border border-lily-green/5">
                   <p className="text-xs text-lily-green/70 leading-relaxed font-serif italic">
                     "{suggestions.reasoning}"
                   </p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
