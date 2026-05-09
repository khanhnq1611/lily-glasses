import React from 'react';
import { motion } from 'motion/react';
import { Info, AlertTriangle, CheckCircle2, Ruler, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlassesStyle } from '../constants/glasses';

export interface FaceMetrics {
  width: number;
  height: number;
  eyeGap: number;
  eyeGapType: 'Gần' | 'Trung bình' | 'Xa';
  bridgeWidth: number;
  bridgePosition: 'Thấp' | 'Trung bình' | 'Cao';
  suggestedSize: 'S' | 'M' | 'L';
  reliability: 'Thấp' | 'Trung bình' | 'Cao';
  explanation: string;
  faceShape?: string;
  recommendedShapes?: string[];
  avoidShapes?: string[];
  foreheadWidth: number;
  cheekboneWidth: number;
  jawlineWidth: number;
  thicknessSuggestion?: string;
  colorSuggestion?: string;
  styleInferred?: string;
}

interface FaceMeasurementCardProps {
  metrics: FaceMetrics;
  selectedGlasses: GlassesStyle;
}

export const FaceMeasurementCard: React.FC<FaceMeasurementCardProps> = ({ metrics, selectedGlasses }) => {
  const isGoodFit = metrics.suggestedSize === selectedGlasses.frameSize;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-lily-green/10 shadow-2xl overflow-hidden mb-10"
    >
      {/* Step 1 & 2: Professional Header */}
      <div className="bg-lily-green px-8 py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl leading-none italic">Chuyên gia AI Stylist</h3>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 mt-1.5 font-bold">Phân tích Hình học & Form dáng</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Tin cậy</div>
            <div className={cn(
              "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border backdrop-blur-sm",
              metrics.reliability === 'Cao' ? "bg-green-400/20 text-green-400 border-green-400/30" : 
              metrics.reliability === 'Trung bình' ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30" : 
              "bg-red-400/20 text-red-400 border-red-400/30"
            )}>
              {metrics.reliability}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Step 2: Face Shape Classification */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h4 className="text-[10px] font-bold text-lily-green/30 uppercase tracking-[0.2em] mb-2">Hình dáng khuôn mặt</h4>
              <p className="text-3xl font-serif font-bold text-lily-green">{metrics.faceShape}</p>
            </div>
            <div className="bg-lily-beige px-6 py-4 rounded-3xl border border-lily-green/5 text-center">
              <span className="text-[9px] font-bold text-lily-green/40 uppercase tracking-widest block mb-1">Size Gợi ý</span>
              <span className="text-2xl font-bold font-mono text-lily-green">{metrics.suggestedSize}</span>
            </div>
          </div>
          
          {/* Step 1 & 3: Geometric Characteristics */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <CharacteristicItem label="Khoảng cách mắt" value={metrics.eyeGapType} />
            <CharacteristicItem label="Sống mũi" value={metrics.bridgePosition} />
            <CharacteristicItem label="Phong cách" value={metrics.styleInferred || "Thanh lịch"} />
            <CharacteristicItem label="Tỉ lệ" value={metrics.height/metrics.width > 1.2 ? "Dài" : "Cân đối"} />
          </div>
        </section>

        <div className="h-px bg-lily-green/5" />

        {/* Step 4: Detailed Eye-wear Recommendations */}
        <section className="space-y-6">
          <div>
            <h4 className="text-[10px] font-bold text-lily-green/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Gợi ý gọng kính
            </h4>
            <div className="flex flex-wrap gap-2">
              {metrics.recommendedShapes?.map((shape, i) => (
                <span key={i} className="px-4 py-2 bg-white border border-lily-green/10 rounded-2xl text-[11px] font-bold text-lily-green shadow-sm hover:border-lily-green/30 transition-colors">
                  {shape}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-lily-beige/30 p-4 rounded-2xl border border-lily-green/5">
              <span className="text-[9px] font-bold text-lily-green/40 uppercase tracking-widest block mb-2">Độ dày gọng</span>
              <span className="text-xs font-bold text-lily-green">{metrics.thicknessSuggestion}</span>
            </div>
            <div className="bg-lily-beige/30 p-4 rounded-2xl border border-lily-green/5">
              <span className="text-[9px] font-bold text-lily-green/40 uppercase tracking-widest block mb-2">Màu sắc gợi ý</span>
              <span className="text-xs font-bold text-lily-green">{metrics.colorSuggestion || "Tông ấm / Vàng kim"}</span>
            </div>
          </div>
        </section>

        {/* Step 6: Avoidance */}
        {metrics.avoidShapes && metrics.avoidShapes.length > 0 && (
          <section className="bg-red-50/30 p-5 rounded-[2rem] border border-red-100/30">
            <h4 className="text-[9px] font-bold text-red-700/50 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <X className="w-3.5 h-3.5" /> Nên tránh
            </h4>
            <div className="flex flex-wrap gap-2">
              {metrics.avoidShapes.map((shape, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/50 rounded-xl text-[10px] text-red-800/60 font-bold border border-red-100 italic">
                  {shape}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Step 5: Professional Explanation */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-lily-green/10 rounded-full" />
          <h4 className="text-[10px] font-bold text-lily-green/30 uppercase tracking-[0.2em] mb-2 px-2">Nguyên tắc Stylist</h4>
          <p className="text-xs text-lily-green/70 leading-relaxed font-serif italic px-2">
            "{metrics.explanation}"
          </p>
        </section>

        {/* Fitting Status */}
        <div className={cn(
          "p-6 rounded-[2rem] flex items-start gap-4 transition-all duration-500",
          isGoodFit ? "bg-lily-green text-white shadow-xl scale-105" : "bg-lily-beige/50 border border-lily-green/10"
        )}>
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", isGoodFit ? "bg-white/20" : "bg-lily-green/10")}>
            {isGoodFit ? <CheckCircle2 className="w-6 h-6" /> : <Info className="w-6 h-6 text-lily-green" />}
          </div>
          <div>
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mb-1", isGoodFit ? "text-white/60" : "text-lily-green/40")}>
              Lựa chọn hiện tại: {selectedGlasses.name}
            </p>
            <p className="text-[11px] font-bold leading-relaxed">
              {isGoodFit 
                ? "Bản phân tích tỉ lệ vàng cho thấy mẫu kính này sinh ra để dành cho bạn." 
                : `Gọng kính này thuộc size ${selectedGlasses.frameSize}. Stylist khuyên bạn nên ưu tiên các mẫu size ${metrics.suggestedSize} để đạt sự cân đối nhất.`}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CharacteristicItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[8px] font-bold text-lily-green/30 uppercase tracking-widest">{label}</span>
    <span className="text-[11px] font-bold text-lily-green">{value}</span>
  </div>
);

