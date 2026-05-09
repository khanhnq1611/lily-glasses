import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlassesStyle } from '../constants/glasses';
import { FaceMetrics } from './FaceMeasurementCard';

interface SuitabilityScoreCardProps {
  metrics: FaceMetrics | null;
  selectedGlasses: GlassesStyle;
  preferences: {
    skinTone: string;
    style: string;
    purpose: string;
  };
}

export const SuitabilityScoreCard: React.FC<SuitabilityScoreCardProps> = ({ 
  metrics, 
  selectedGlasses, 
  preferences 
}) => {
  // Mock data for demo if no metrics
  const displayMetrics = metrics || {
    faceShape: 'Tròn',
    suggestedSize: 'M',
    eyeGapType: 'Trung bình',
  };

  const calculateScore = () => {
    if (!displayMetrics.faceShape) return 0;

    let score = 0;

    // 1. Face Shape (30%)
    if (selectedGlasses.suitableFaceShapes.includes(displayMetrics.faceShape as string)) {
      score += 30;
    } else {
      score += 15; // Partial match
    }

    // 2. Face Width / Size (15%)
    if (selectedGlasses.frameSize === displayMetrics.suggestedSize) {
      score += 15;
    } else {
      score += 5;
    }

    // 3. Eye Distance (10%)
    // Standard logic for eye distance
    score += 10; 

    // 4. Skin Tone (15%)
    if (selectedGlasses.suitableSkinTones.includes(preferences.skinTone)) {
      score += 15;
    } else {
      score += 7;
    }

    // 5. Style (15%)
    if (selectedGlasses.suitableStyles.includes(preferences.style)) {
      score += 15;
    } else {
      score += 5;
    }

    // 6. Purpose (15%)
    if (selectedGlasses.suitablePurposes.includes(preferences.purpose)) {
      score += 15;
    } else {
      score += 5;
    }

    return score;
  };

  const score = calculateScore();
  
  const getRating = (s: number) => {
    if (s >= 85) return { label: 'Rất phù hợp', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' };
    if (s >= 70) return { label: 'Phù hợp', color: 'text-lily-green', bg: 'bg-lily-green/10', border: 'border-lily-green/20' };
    if (s >= 50) return { label: 'Tạm ổn', color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    return { label: 'Chưa thật sự phù hợp', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
  };

  const rating = getRating(score);

  const getExplanation = () => {
    const isShapeMatch = selectedGlasses.suitableFaceShapes.includes(displayMetrics.faceShape as string);
    const isStyleMatch = selectedGlasses.suitableStyles.includes(preferences.style);
    
    let text = `Mẫu kính này ${rating.label.toLowerCase()} vì `;
    
    if (isShapeMatch) {
      text += `dáng ${selectedGlasses.frameShape} giúp khuôn mặt ${displayMetrics.faceShape} trông cân đối hơn. `;
    } else {
      text += `tuy không phải dáng tối ưu nhất cho ${displayMetrics.faceShape} nhưng vẫn mang lại nét riêng. `;
    }

    if (isStyleMatch) {
      text += `Màu ${selectedGlasses.displayColor} rất hợp với phong cách ${preferences.style} và phù hợp khi ${preferences.purpose}.`;
    }

    return text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[2.5rem] border border-lily-green/10 shadow-2xl overflow-hidden mb-6"
    >
      <div className="bg-lily-green px-8 py-5 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-lg italic">Điểm tương thích</h3>
        </div>
        <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md", rating.bg, rating.color, rating.border)}>
          {rating.label}
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="relative">
             <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-lily-green/10"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-lily-green"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono text-lily-green">{score}%</span>
             </div>
          </div>

          <div className="flex-1 ml-8 space-y-4">
             <div>
                <h4 className="text-[10px] font-bold text-lily-green/30 uppercase tracking-widest mb-1">Kết luận Stylist</h4>
                <p className="text-xs text-lily-green/70 leading-relaxed font-serif italic">
                  "{getExplanation()}"
                </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
           <ScoreIndicator label="Dáng mặt" match={selectedGlasses.suitableFaceShapes.includes(displayMetrics.faceShape as string)} />
           <ScoreIndicator label="Tone da" match={selectedGlasses.suitableSkinTones.includes(preferences.skinTone)} />
           <ScoreIndicator label="Phong cách" match={selectedGlasses.suitableStyles.includes(preferences.style)} />
        </div>
      </div>
    </motion.div>
  );
};

const ScoreIndicator = ({ label, match }: { label: string, match: boolean }) => (
  <div className={cn(
    "px-3 py-2 rounded-xl border flex flex-col items-center gap-1",
    match ? "bg-green-50 border-green-100" : "bg-lily-beige/30 border-lily-green/5"
  )}>
    <span className="text-[8px] font-bold text-lily-green/30 uppercase tracking-widest">{label}</span>
    {match ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Info className="w-3 h-3 text-lily-green/20" />}
  </div>
);
