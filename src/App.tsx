/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Download, Sparkles, AlertCircle, Check, ChevronRight, X, Info, ShoppingCart, CheckCircle2, Ruler, Shirt } from 'lucide-react';
import { cn } from './lib/utils';
import { GLASSES_LIST, GlassesStyle } from './constants/glasses';
import { drawGlasses } from './lib/GlassesRenderer';
import { generateContent, generateVisionContent, generateImage, checkApiCapabilities } from './lib/openrouterApi';
import confetti from 'canvas-confetti';

import * as FaceMeshModule from '@mediapipe/face_mesh';
import * as CameraModule from '@mediapipe/camera_utils';

const FaceMesh = FaceMeshModule.FaceMesh || (window as any).FaceMesh;
const MediaPipeCamera = CameraModule.Camera || (window as any).Camera;

declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

import { FaceMeasurementCard, FaceMetrics } from './components/FaceMeasurementCard';
import { OutfitMatchCard } from './components/OutfitMatchCard';
import { SuitabilityScoreCard } from './components/SuitabilityScoreCard';

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'outfit'>('camera');
  const [selectedGlasses, setSelectedGlasses] = useState<GlassesStyle>(GLASSES_LIST[0]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics | null>(null);
  const [hasReference, setHasReference] = useState(false);
  const [preferences, setPreferences] = useState({
    skinTone: 'trung bình',
    style: 'thanh lịch',
    purpose: 'đi làm'
  });

  // EMA for smoothing values
  const metricsRef = useRef<{w: number, h: number, g: number, bw: number, bp: number, fw: number, jw: number}>({ 
    w: 0, h: 0, g: 0, bw: 0, bp: 0, fw: 0, jw: 0 
  });

  const resetMetrics = () => {
    metricsRef.current = { w: 0, h: 0, g: 0, bw: 0, bp: 0, fw: 0, jw: 0 };
    setFaceMetrics(null);
  };
  const [aiError, setAiError] = useState<string | null>(null);

  const alpha = 0.1; // Smoothing factor (0-1)

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    // Check API capabilities on app load
    console.log('🚀 App initialized, checking API capabilities...');
    checkApiCapabilities().catch(err => console.error('Capability check failed:', err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAiSuggestion = async () => {
      // Small delay to debounce rapid clicks
      await new Promise(r => setTimeout(r, 500));
      if (!isMounted) return;

       try {
          setAiError(null);
          const response = await generateContent({
            model: "gpt-3.5-turbo",
            contents: {
              parts: [{ text: `Bạn là một chuyên gia đo đạc nhân trắc học khuôn mặt và tư vấn thị lực chuyên gia. Hãy đưa ra lời khuyên ngắn gọn (tối đa 25 từ) bằng tiếng Việt cho khách hàng đang thử gọng hay sản phẩm ${selectedGlasses.name} (loại: ${selectedGlasses.type}). Giải thích tại sao kiểu dáng này phù hợp (ví dụ: gọng ${selectedGlasses.type} giúp cân bằng khuôn mặt).` }]
              } as any,
          });
          if (isMounted) setAiSuggestion(response.text || "");
        } catch (e: any) {
          console.warn("AI Suggestion error:", e);
          if (isMounted) {
            setAiSuggestion(`Gọng ${selectedGlasses.type} của ${selectedGlasses.name} được thiết kế để tối ưu hóa góc nhìn và tôn vinh cấu trúc xương mặt của bạn.`);
          }
        }
     };
     fetchAiSuggestion();
     return () => { isMounted = false; };
  }, [selectedGlasses.id]);

  const startCamera = async () => {
    if (!videoRef.current || !faceMeshRef.current) return;
    
    setCameraError(null);
    setIsCameraActive(false);

    try {
      // Explicitly request permission first to ensure browser prompt trigger
      // Using minimal constraints first for highest prompt success rate
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true
      });
      
      // Stop the test tracks immediately to let MediaPipe manage its own stream
      stream.getTracks().forEach(track => track.stop());

      if (cameraRef.current) {
        try {
          await cameraRef.current.stop();
        } catch (e) {
          console.log("Error stopping previous camera", e);
        }
      }

      cameraRef.current = new MediaPipeCamera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && activeTabRef.current === 'camera') {
            try {
              await faceMeshRef.current?.send({ image: videoRef.current });
            } catch (e) {
              console.error("Detection error:", e);
            }
          }
        },
        width: 1280,
        height: 720
      });

      await cameraRef.current.start();
      setIsCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.error("Camera activation error details:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setCameraError("Quyền Camera bị chặn. Hãy nhấn 'Cấp quyền' hoặc mở app ở tab mới để trình duyệt cho phép.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("Không tìm thấy thiết bị camera trên máy của bạn.");
      } else if (err.name === 'NotReadableError') {
        setCameraError("Camera đang được sử dụng bởi một ứng dụng khác.");
      } else {
        setCameraError(`Lỗi: ${err.message || "Không thể khởi động camera"}`);
      }
    }
  };

  useEffect(() => {
    const initAI = async () => {
      try {
        const faceMesh = new FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          if (!canvasRef.current) return;
          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          canvasCtx.save();
          
          // Set canvas dimensions to match video/image
          if (results.image) {
            if (canvasRef.current.width !== results.image.width || canvasRef.current.height !== results.image.height) {
              canvasRef.current.width = results.image.width;
              canvasRef.current.height = results.image.height;
            }
          }

          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (activeTabRef.current === 'camera') {
            canvasCtx.translate(canvasRef.current.width, 0);
            canvasCtx.scale(-1, 1);
          }
          
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (activeTabRef.current === 'camera') {
            canvasCtx.restore();
          }

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            let finalLandmarks = landmarks;
            if (activeTabRef.current === 'camera') {
              finalLandmarks = landmarks.map((l: any) => ({ ...l, x: 1 - l.x }));
            }

            const leftEye = finalLandmarks[33];
            const rightEye = finalLandmarks[263];
            const bridge = finalLandmarks[168];

            // Metrics calculation
            const foreheadLeft = finalLandmarks[103];
            const foreheadRight = finalLandmarks[332];
            const checkboneLeft = finalLandmarks[234];
            const cheekboneRight = finalLandmarks[454];
            const jawLeft = finalLandmarks[172];
            const jawRight = finalLandmarks[397];
            const chin = finalLandmarks[152];
            const top = finalLandmarks[10];
            const bridgeLeft = finalLandmarks[188];
            const bridgeRight = finalLandmarks[412];

            const fWR = Math.sqrt(Math.pow(foreheadRight.x - foreheadLeft.x, 2) + Math.pow(foreheadRight.y - foreheadLeft.y, 2));
            const cWR = Math.sqrt(Math.pow(cheekboneRight.x - checkboneLeft.x, 2) + Math.pow(cheekboneRight.y - checkboneLeft.y, 2));
            const jWR = Math.sqrt(Math.pow(jawRight.x - jawLeft.x, 2) + Math.pow(jawRight.y - jawLeft.y, 2));
            const fHR = Math.sqrt(Math.pow(chin.y - top.y, 2) + Math.pow(chin.x - top.x, 2));
            const eGR = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));
            const bWR = Math.sqrt(Math.pow(bridgeRight.x - bridgeLeft.x, 2) + Math.pow(bridgeRight.y - bridgeLeft.y, 2));
            const bPR = Math.sqrt(Math.pow(bridge.y - top.y, 2) + Math.pow(bridge.x - top.x, 2)) / fHR;

            const CM_SCALE = hasReferenceRef.current ? 75.0 : 70.0;
            const smoothing = (activeTabRef.current === 'camera') ? 0.05 : 1.0;

            metricsRef.current = {
              w: metricsRef.current.w === 0 ? cWR : metricsRef.current.w * (1 - smoothing) + cWR * smoothing,
              h: metricsRef.current.h === 0 ? fHR : metricsRef.current.h * (1 - smoothing) + fHR * smoothing,
              g: metricsRef.current.g === 0 ? eGR : metricsRef.current.g * (1 - smoothing) + eGR * smoothing,
              bw: metricsRef.current.bw === 0 ? bWR : metricsRef.current.bw * (1 - smoothing) + bWR * smoothing,
              bp: metricsRef.current.bp === 0 ? bPR : metricsRef.current.bp * (1 - smoothing) + bPR * smoothing,
              fw: metricsRef.current.fw === 0 ? fWR : metricsRef.current.fw * (1 - smoothing) + fWR * smoothing,
              jw: metricsRef.current.jw === 0 ? jWR : metricsRef.current.jw * (1 - smoothing) + jWR * smoothing,
            };

            const fw = metricsRef.current.w * CM_SCALE;
            const fh = metricsRef.current.h * CM_SCALE;
            const foreheadCm = metricsRef.current.fw * CM_SCALE;
            const jawCm = metricsRef.current.jw * CM_SCALE;
            const eg = metricsRef.current.g * CM_SCALE;
            const bw = metricsRef.current.bw * CM_SCALE;

            let shape = "Oval";
            let recommended = ["Wayfarer", "Chữ nhật"];
            let avoid = ["Tròn quá"];
            const hW = fh / fw;
            if (hW > 1.35) shape = "Mặt Dài";
            else if (hW < 1.1) shape = foreheadCm > jawCm * 1.1 ? "Trái Tim" : "Mặt Tròn";
            else if (Math.abs(foreheadCm - jawCm) < 1.0) shape = "Mặt Vuông";

            setFaceMetrics({
              width: fw, height: fh, foreheadWidth: foreheadCm, cheekboneWidth: fw, jawlineWidth: jawCm,
              eyeGap: eg, eyeGapType: 'Trung bình', bridgeWidth: bw, bridgePosition: 'Trung bình',
              suggestedSize: fw > 14.5 ? 'L' : fw < 13.0 ? 'S' : 'M', reliability: 'Trung bình',
              explanation: `Khuôn mặt ${shape} của bạn được AI phân tích chi tiết.`,
              faceShape: shape, recommendedShapes: recommended, avoidShapes: avoid,
              thicknessSuggestion: "Gọng vừa", styleInferred: "Thanh lịch", colorSuggestion: "Tôn lạnh"
            });

            drawGlasses(
              canvasCtx as any,
              { leftEye, rightEye, bridge },
              selectedGlassesRef.current,
              canvasRef.current.width,
              canvasRef.current.height
            );
          }
          
          if (activeTabRef.current === 'upload') {
            canvasCtx.restore();
          }
        });

        faceMeshRef.current = faceMesh;
        setIsModelLoaded(true);
      } catch (e) {
        console.error("Failed to initialize FaceMesh", e);
        setCameraError("Không thể khởi tạo động cơ AI.");
      }
    };

    initAI();
  }, []);

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  const hasReferenceRef = useRef(hasReference);
  useEffect(() => { hasReferenceRef.current = hasReference; }, [hasReference]);
  const selectedGlassesRef = useRef(selectedGlasses);
  useEffect(() => { selectedGlassesRef.current = selectedGlasses; }, [selectedGlasses]);

  useEffect(() => {
    if (activeTab === 'upload' && capturedImage && isModelLoaded && faceMeshRef.current) {
      const img = new Image();
      img.src = capturedImage;
      img.onload = () => {
        // Redraw immediately
        const event = new CustomEvent('force-detection');
        window.dispatchEvent(event);
      };
    }
  }, [selectedGlasses, activeTab, capturedImage, isModelLoaded]);

  useEffect(() => {
    if (!isModelLoaded || !faceMeshRef.current) return;

    let isStopped = false;

    const forceDetectionHandler = () => {
      if (activeTab === 'upload' && capturedImage) {
        const img = new Image();
        img.src = capturedImage;
        img.onload = () => {
          if (!isStopped) runDetection(img);
        };
      }
    };
    window.addEventListener('force-detection', forceDetectionHandler);

    // Helper to calculate cm from pixels
    const calculatePixelToCmRatio = (refPixelWidth: number) => {
      // Standard card width is 8.56cm
      return 8.56 / refPixelWidth;
    };

    const runDetection = async (input: HTMLVideoElement | HTMLImageElement) => {
      if (!faceMeshRef.current) return;
      await faceMeshRef.current.send({ image: input });
    };

    if (activeTab === 'camera') {
      startCamera();
    } else if (activeTab === 'upload' && capturedImage) {
      resetMetrics();
      const img = new Image();
      img.src = capturedImage;
      img.onload = () => runDetection(img);
    }

    return () => {
      isStopped = true;
      window.removeEventListener('force-detection', forceDetectionHandler);
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      setIsCameraActive(false);
    };
  }, [isModelLoaded, activeTab, capturedImage]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `visionary-tryon-${selectedGlasses.id}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#1A1A1A', '#FFFFFF']
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setAiGeneratedImage(null);
      setActiveTab('upload');
    };
    reader.readAsDataURL(file);
  };

    const handleAiTryOn = async (targetGlasses?: GlassesStyle) => {
      if (!capturedImage) return;
      const glassesToTry = targetGlasses || selectedGlasses;
      
      setIsAiProcessing(true);
      
      try {
        setAiError(null);
        
        const userImageBase64 = capturedImage.split(',')[1];
        const userMime = capturedImage.split(';')[0]?.split(':')[1] || 'image/jpeg';

        console.log('📸 Image uploaded, starting AI try-on process...');
        console.log('Image MIME type:', userMime);
        console.log('Image base64 length:', userImageBase64?.length);

        // Step 1: Analyze the portrait to understand face position and features
        const analysisPrompt = `Analyze this portrait photo for glasses overlay purposes:

1. Face orientation: Is it front-facing or at an angle? (angle in degrees if not front)
2. Face width: Approximate proportion (narrow/medium/wide)
3. Eye position: Vertical and horizontal placement on the face
4. Nose bridge: Position and shape (to align glasses bridge)
5. Facial structure: Cheekbones, jawline shape
6. Skin tone: General description
7. Lighting: Direction and quality (natural/artificial, shadows, highlights)
8. Background: Description (solid, blurred, detailed)
9. Hair color and style: How it frames the face
10. Any distinctive features: Marks, scars, etc. (so we preserve them)

Be specific but concise - this helps properly overlay glasses on the original face.`;

        console.log('🔍 Analyzing portrait...');
        let analysis = '';
        try {
          analysis = await generateVisionContent(
            userImageBase64,
            userMime,
            analysisPrompt,
            'gpt-4-vision'
          );
          console.log('✅ Portrait analysis:', analysis.substring(0, 100));
        } catch (analysisError) {
          console.warn('⚠️ Vision analysis failed, using generic description:', analysisError);
          analysis = "Front-facing portrait with natural lighting, suitable for glasses fitting";
        }

        // Step 2: Create a detailed prompt for image generation
        const generationPrompt = `You are an expert at adding eyeglasses to portrait photos.

Add ${glassesToTry.name} eyeglasses to this portrait with these requirements:

CRITICAL INSTRUCTIONS:
- PRESERVE the original face, skin tone, facial features, and expression
- PRESERVE the original hair, background, and lighting
- ONLY modify: Add realistic glasses overlaid on the face
- Keep 100% of the original portrait - just add glasses on top

Glasses to add:
- Name: ${glassesToTry.name}
- Style: ${glassesToTry.type}
- Color: ${glassesToTry.displayColor}
- Shape: ${glassesToTry.frameShape}
- Material: ${glassesToTry.material}
- Description: ${glassesToTry.description}

Portrait analysis: ${analysis}

Positioning requirements:
- Glasses bridge: aligned with nose bridge
- Glasses frame: resting naturally on cheekbones
- Temples: extending toward ears smoothly
- Lenses: clear and reflective, matching face angle
- Frame fit: proportional to face width
- Lighting: consistent with original portrait lighting

Output:
- Realistic, natural appearance
- Professional quality
- Original person's identity preserved
- Glasses blend seamlessly with original portrait
- 1024x1024 resolution`;

        console.log('🎨 Creating virtual try-on using Gemini 2.5 Flash Image...');
        
        // Use Gemini 2.5 Flash Image for better glasses fitting
        try {
          const { generateVirtualTryOn } = await import('./lib/openrouterApi');
          const enhancedImage = await generateVirtualTryOn(
            capturedImage,
            glassesToTry.name,
            glassesToTry.type,
            glassesToTry.displayColor,
            glassesToTry.frameShape,
            glassesToTry.material,
            glassesToTry.description
          );
          console.log('✅ Virtual try-on created successfully with Gemini 2.5 Flash Image');
          setAiGeneratedImage(enhancedImage);
        } catch (geminiError: any) {
          console.error('❌ Gemini 2.5 try-on failed:', geminiError);
          setAiError('Lỗi tạo hình ảnh try-on: ' + (geminiError.message || 'Vui lòng thử lại'));
          setIsAiProcessing(false);
          return;
        }
        
      } catch (error: any) {
        console.error("❌ AI Try-On error:", error);
        setAiError(error.message || "Lỗi API AI: " + (error.error?.message || "Không thể tạo hình ảnh"));
      } finally {
        setIsAiProcessing(false);
      }
    };

  // Seamless Integration Trigger
  useEffect(() => {
    if (activeTab === 'upload' && capturedImage && isModelLoaded && !isAiProcessing) {
      handleAiTryOn(selectedGlasses);
    }
  }, [selectedGlasses, capturedImage, isModelLoaded]);

  return (
    <div className="min-h-screen bg-lily-beige text-lily-green font-sans selection:bg-lily-green selection:text-white">
      {/* Header */}
      <header id="app-header" className="border-b border-lily-green/10 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 id="app-brand-title" className="text-2xl font-serif font-bold tracking-tight text-lily-green leading-none">KÍNH MẮT LILY</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-lily-green/60 font-semibold mt-1">Hà Nội • Sài Gòn • Đà Nẵng</p>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-widest text-lily-green/60">
            <a href="#" className="hover:text-lily-green transition-colors border-b border-lily-green pb-1 text-lily-green">Thử Kính AI</a>
            <a href="#" className="hover:text-lily-green transition-colors">Bộ Sưu Tập</a>
            <a href="#" className="hover:text-lily-green transition-colors">Hệ Thống Cửa Hàng</a>
            <a href="#" className="hover:text-lily-green transition-colors">Về Lily</a>
          </nav>
          <div className="flex items-center gap-5">
            <button className="text-[11px] font-bold uppercase tracking-widest hover:text-lily-green/70 transition-all border-b border-transparent hover:border-lily-green pb-1">
              Đăng nhập
            </button>
            <div className="w-10 h-10 rounded-full border border-lily-green/20 flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-lily-green hover:text-white transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Try-On Stage */}
          <div id="try-on-stage-container" className="lg:col-span-8 flex flex-col gap-8">
            <div id="canvas-wrapper" className="relative aspect-video bg-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl group ring-1 ring-white/10">
              {/* Status Indicator */}
              <AnimatePresence>
                {(isCameraActive || (activeTab === 'upload' && capturedImage)) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-8 left-8 flex items-center gap-2.5 bg-lily-green/40 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 shadow-xl z-20"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      isCameraActive ? "bg-green-400 shadow-[0_0_10px_#4ade80]" : "bg-blue-400 shadow-[0_0_10px_#60a5fa]"
                    )} />
                    <span className="text-[10px] text-white font-bold uppercase tracking-[0.2em]">
                      {activeTab === 'camera' ? "TRỰC TIẾP" : "PHÂN TÍCH ẢNH"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <video 
                ref={videoRef} 
                className="absolute opacity-0 pointer-events-none" 
                playsInline 
                muted
              />
              {activeTab === 'upload' && aiGeneratedImage && (
                <div className="absolute inset-0 z-10">
                  <img 
                    src={aiGeneratedImage} 
                    className="w-full h-full object-contain"
                    alt="AI Enhanced Try-On"
                  />
                  {/* Subtle Canvas Overlay for real-time adjustments if needed, though usually hidden */}
                  <canvas 
                    ref={canvasRef} 
                    className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
                  />
                </div>
              )}

              {activeTab === 'upload' && !aiGeneratedImage && capturedImage && (
                 <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-contain block"
                />
              )}

              {activeTab === 'camera' && (
                <canvas 
                  ref={canvasRef} 
                  className={cn(
                    "w-full h-full object-cover",
                    !isCameraActive ? "hidden" : "block"
                  )}
                />
              )}

              {/* High Fidelity Loading State */}
              {activeTab === 'upload' && isAiProcessing && (
                <div className="absolute top-8 right-8 z-50 flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-2xl">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-white rounded-full" />
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-white rounded-full" />
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <span className="text-[10px] text-white font-bold uppercase tracking-[0.2em]">AI High-Fidelity Rendering...</span>
                </div>
              )}

              {aiError && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs border border-white/20">
                  <AlertCircle className="w-4 h-4" />
                  <span>{aiError}. Đang dùng chế độ hiển thị 2D tối ưu.</span>
                  <button onClick={() => setAiError(null)} className="ml-2 hover:bg-white/20 rounded-full p-1"><X className="w-3 h-3" /></button>
                </div>
              )}

              {activeTab === 'camera' && !isCameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-lily-green text-white">
                  <div className="relative">
                    <div className="animate-ping absolute inset-0 w-full h-full border-2 border-white/20 rounded-full" />
                    <div className="animate-spin w-10 h-10 border-2 border-white/20 border-t-white rounded-full mb-4" />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase mt-4">Đang kết nối Vision AI</p>
                </div>
              )}

              {activeTab === 'upload' && !capturedImage && (
                <div className="absolute inset-0 bg-[#f4f3ed] flex flex-col items-center justify-center p-8">
                  <label className="flex flex-col items-center gap-6 cursor-pointer group">
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-lily-green/5">
                      <Upload className="w-8 h-8 text-lily-green" />
                    </div>
                    <div className="text-center">
                      <p className="font-serif text-2xl font-bold text-lily-green mb-2">Tải ảnh chân dung của bạn</p>
                      <p className="text-xs text-lily-green/40 font-medium tracking-wide">Định dạng JPG, PNG (tối đa 10MB)</p>
                    </div>
                    <div className="px-10 py-3 bg-lily-green text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg group-hover:bg-lily-green-light transition-colors">
                      Chọn Ảnh
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              )}

              {/* Flash Effect */}
              <AnimatePresence>
                {showFlash && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-[100]"
                  />
                )}
              </AnimatePresence>

              {activeTab === 'upload' && capturedImage && (
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {cameraError && activeTab === 'camera' && (
                <div id="camera-error-container" className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] px-12 text-center z-[60]">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{cameraError}</h3>
                  <div className="text-white/60 text-sm mb-8 max-w-md space-y-2">
                    <p>Trình duyệt thường chặn Camera khi chạy trong iframe (chế độ xem thử).</p>
                    <p className="text-xs italic">Mẹo: Nhấn vào biểu tượng Camera trên thanh địa chỉ để cấp lại quyền, sau đó nhấn "Thử lại".</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      id="retry-camera-btn"
                      onClick={startCamera}
                      className="px-8 py-3 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Cấp quyền & Thử lại
                    </button>
                    <button 
                      id="open-new-tab-btn"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-full font-bold text-sm tracking-wide hover:bg-white/20 transition-all active:scale-95"
                    >
                      Mở tab mới (Khuyên dùng)
                    </button>
                  </div>
                </div>
              )}

              {/* Capture Button Container */}
              <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center items-center gap-6 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                {activeTab === 'camera' && isCameraActive && (
                  <button 
                    onClick={() => {
                      if (!videoRef.current) return;
                      // Logic to capture RAW video frame
                      const captureCanvas = document.createElement('canvas');
                      captureCanvas.width = videoRef.current.videoWidth;
                      captureCanvas.height = videoRef.current.videoHeight;
                      const ctx = captureCanvas.getContext('2d');
                      if (ctx) {
                        // Mirror the capture to match the preview
                        ctx.translate(captureCanvas.width, 0);
                        ctx.scale(-1, 1);
                        ctx.drawImage(videoRef.current, 0, 0);
                        const dataUrl = captureCanvas.toDataURL('image/png');
                        
                        setShowFlash(true);
                        setTimeout(() => setShowFlash(false), 150);
                        
                        setCapturedImage(dataUrl);
                        setActiveTab('upload');
                        
                        confetti({
                          particleCount: 40,
                          startVelocity: 15,
                          spread: 50,
                          origin: { y: 0.8 },
                          colors: ['#FFFFFF', '#1a3a3a']
                        });
                      }
                    }}
                    className="w-20 h-20 bg-white rounded-full border-[6px] border-white/20 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  >
                    <div className="w-14 h-14 bg-white rounded-full border-2 border-lily-green/10 flex items-center justify-center">
                      <Camera className="w-7 h-7 text-lily-green" />
                    </div>
                  </button>
                )}

                {(isCameraActive || (activeTab === 'upload' && capturedImage)) && (
                  <div className="flex flex-wrap justify-center items-center gap-4">
                    {activeTab === 'upload' && capturedImage && (
                      <button 
                        onClick={aiGeneratedImage ? () => setAiGeneratedImage(null) : handleAiTryOn}
                        disabled={isAiProcessing}
                        className={cn(
                          "px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all",
                          aiGeneratedImage 
                            ? "bg-white text-lily-green hover:bg-gray-100" 
                            : "bg-gradient-to-r from-purple-600 to-lily-green text-white hover:scale-105 active:scale-95"
                        )}
                      >
                        {aiGeneratedImage ? (
                          <>
                            <X className="w-4 h-4" />
                            Hủy Ghép AI
                          </>
                        ) : (
                          <>
                            <Sparkles className={cn("w-4 h-4", isAiProcessing && "animate-spin")} />
                            {isAiProcessing ? "Đang xử lý..." : "Thử kính AI"}
                          </>
                        )}
                      </button>
                    )}
                    <button 
                      onClick={handleDownload}
                      className="px-10 py-4 bg-lily-green text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-lily-green-light hover:scale-105 active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Tải Ảnh
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div id="tab-switcher-card" className="bg-white rounded-3xl p-6 md:p-8 border border-lily-green/10 flex flex-col lg:flex-row items-center justify-between shadow-sm gap-8">
              <div id="tab-buttons-container" className="flex bg-lily-beige p-1.5 rounded-full ring-1 ring-lily-green/5 w-full lg:w-auto overflow-x-auto no-scrollbar">
                <button 
                  id="tab-camera-btn"
                  onClick={() => {
                    setActiveTab('camera');
                    setCapturedImage(null);
                    resetMetrics();
                  }}
                  className={cn(
                    "flex-1 lg:flex-none px-6 md:px-10 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                    activeTab === 'camera' ? "bg-lily-green text-white shadow-lg" : "text-lily-green/60 hover:bg-lily-green/5"
                  )}
                >
                  <Camera className="w-4 h-4" />
                  Live Video
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('upload');
                    resetMetrics();
                  }}
                  className={cn(
                    "flex-1 lg:flex-none px-6 md:px-10 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                    activeTab === 'upload' ? "bg-lily-green text-white shadow-lg" : "text-lily-green/60 hover:bg-lily-green/5"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Ảnh Chụp
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('outfit');
                    setCapturedImage(null);
                  }}
                  className={cn(
                    "flex-1 lg:flex-none px-6 md:px-10 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                    activeTab === 'outfit' ? "bg-lily-green text-white shadow-lg" : "text-lily-green/60 hover:bg-lily-green/5"
                  )}
                >
                  <Shirt className="w-4 h-4" />
                  Outfit
                </button>
              </div>
              <div className="flex items-center gap-8 md:gap-16">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-lily-green/40 mb-1 whitespace-nowrap">Công nghệ</span>
                  <span className="text-[11px] font-bold whitespace-nowrap">FaceMesh AI</span>
                </div>
                <div className="h-10 w-px bg-lily-green/10" />
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-lily-green/40 mb-1 whitespace-nowrap">Độ trễ</span>
                  <span className="text-[11px] font-bold whitespace-nowrap">~ 5ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Product Gallery */}
          <div id="product-sidebar" className="lg:col-span-4 flex flex-col gap-10">
            {/* Suitability Score Card */}
            {activeTab !== 'outfit' && capturedImage && (
              <SuitabilityScoreCard 
                metrics={faceMetrics} 
                selectedGlasses={selectedGlasses} 
                preferences={preferences}
              />
            )}

            {/* User Preferences Selector */}
            {activeTab !== 'outfit' && capturedImage && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-lily-green/10 shadow-sm mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-lily-green/40 mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Tùy chỉnh phong cách
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] font-bold text-lily-green/30 uppercase tracking-widest block mb-3">Tone da của bạn</span>
                    <div className="flex gap-2">
                      {['sáng', 'trung bình', 'ngăm'].map(tone => (
                        <button
                          key={tone}
                          onClick={() => setPreferences({ ...preferences, skinTone: tone })}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border capitalize",
                            preferences.skinTone === tone 
                              ? "bg-lily-green text-white border-transparent" 
                              : "bg-lily-beige/30 text-lily-green/60 border-lily-green/5"
                          )}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-lily-green/30 uppercase tracking-widest block mb-3">Phong cách</span>
                      <select 
                        value={preferences.style}
                        onChange={(e) => setPreferences({ ...preferences, style: e.target.value })}
                        className="w-full bg-lily-beige/30 border border-lily-green/5 rounded-xl px-3 py-2 text-[10px] font-bold text-lily-green focus:outline-none focus:border-lily-green/20"
                      >
                        <option value="thanh lịch">Thanh lịch</option>
                        <option value="tối giản">Tối giản</option>
                        <option value="trẻ trung">Trẻ trung</option>
                        <option value="cá tính">Cá tính</option>
                        <option value="sang trọng">Sang trọng</option>
                        <option value="năng động">Năng động</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-lily-green/30 uppercase tracking-widest block mb-3">Mục đích</span>
                      <select 
                        value={preferences.purpose}
                        onChange={(e) => setPreferences({ ...preferences, purpose: e.target.value })}
                        className="w-full bg-lily-beige/30 border border-lily-green/5 rounded-xl px-3 py-2 text-[10px] font-bold text-lily-green focus:outline-none focus:border-lily-green/20"
                      >
                        <option value="đi làm">Đi làm</option>
                        <option value="đi học">Đi học</option>
                        <option value="đi chơi">Đi chơi</option>
                        <option value="chống nắng">Chống nắng</option>
                        <option value="thời trang">Thời trang</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Result Card */}
            {activeTab !== 'outfit' && capturedImage && faceMetrics && (
              <FaceMeasurementCard 
                metrics={faceMetrics} 
                selectedGlasses={selectedGlasses} 
              />
            )}

            {activeTab === 'outfit' && (
              <OutfitMatchCard onSelectGlasses={(g) => {
                setSelectedGlasses(g);
                if (capturedImage) {
                  setActiveTab('upload');
                } else {
                  setActiveTab('camera');
                }
              }} />
            )}

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-lily-green text-white text-[9px] font-bold uppercase tracking-[0.2em] rounded-full">New Arrival</span>
                <span className="text-[10px] font-bold text-lily-green/40 uppercase tracking-[0.2em]">Kỳ Nghỉ 2024</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-lily-green leading-[1.1]">Chọn gọng kính phù hợp với bạn</h2>
              <p className="text-lily-green/60 text-sm leading-relaxed font-medium">Khám phá bộ sưu tập gọng kính mới nhất từ Lily Eyewear với công nghệ thử kính thực tế ảo.</p>
            </div>

            <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
              {GLASSES_LIST.map((glasses) => (
                <div
                  key={glasses.id}
                  onClick={() => setSelectedGlasses(glasses)}
                  className={cn(
                    "group relative p-6 rounded-[2rem] border transition-all text-left flex items-center gap-6 cursor-pointer",
                    selectedGlasses.id === glasses.id 
                      ? "bg-white border-lily-green shadow-xl translate-x-3" 
                      : "bg-white border-transparent hover:border-lily-green/20"
                  )}
                >
                  <div className="w-16 h-16 rounded-2xl bg-lily-beige flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform border border-lily-green/5 overflow-hidden">
                     {glasses.image ? (
                       <img src={glasses.image} alt={glasses.name} className="w-full h-full object-contain" />
                     ) : (
                       <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-sm" style={{ stroke: glasses.color }}>
                          {glasses.type === 'browline' ? (
                            <>
                              <path d="M10,15 L40,15 Q45,15 45,20 L45,30 Q45,35 30,35 Q10,35 10,25 Z" fill="none" strokeWidth="4" />
                              <path d="M90,15 L60,15 Q55,15 55,20 L55,30 Q55,35 70,35 Q90,35 90,25 Z" fill="none" strokeWidth="4" />
                              <path d="M45,20 Q50,15 55,20" fill="none" strokeWidth="2" />
                            </>
                          ) : glasses.type === 'round' ? (
                            <>
                              <circle cx="28" cy="20" r="15" fill="none" strokeWidth="2.5" />
                              <circle cx="72" cy="20" r="15" fill="none" strokeWidth="2.5" />
                              <path d="M43,20 Q50,15 57,20" fill="none" strokeWidth="1.5" />
                            </>
                          ) : glasses.type === 'aviator' ? (
                            <>
                              <path d="M10,15 Q10,40 30,38 Q45,36 45,20 L45,15 Z" fill="none" strokeWidth="2" />
                              <path d="M90,15 Q90,40 70,38 Q55,36 55,20 L55,15 Z" fill="none" strokeWidth="2" />
                              <path d="M45,15 L55,15" fill="none" strokeWidth="1.5" />
                            </>
                          ) : (
                            <>
                              <path d="M10,20 Q10,35 30,35 Q50,35 50,20 Q50,35 70,35 Q90,35 90,20" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                              <path d="M30,15 L70,15" fill="none" strokeWidth="1.5" strokeOpacity="0.2" />
                            </>
                          )}
                       </svg>
                     )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-lily-green/40">{glasses.type}</span>
                      <span className="text-xs font-bold text-lily-green">{glasses.price}</span>
                    </div>
                    <h3 className="font-bold text-[15px] text-lily-green tracking-tight leading-tight mb-2">{glasses.name}</h3>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full border border-black/5" style={{ backgroundColor: glasses.color }} />
                        <span className="text-[9px] font-bold text-lily-green/40 uppercase tracking-[0.2em]">{glasses.id.includes('titanium') ? 'Premium Titanium' : 'High-grade Acetate'}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          confetti({
                            particleCount: 20,
                            spread: 30,
                            origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
                            colors: ['#1a3a3a', '#ffffff']
                          });
                        }}
                        className="w-8 h-8 rounded-full bg-lily-green text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md mt-[-8px]"
                        title="Thêm vào giỏ hàng"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {selectedGlasses.id === glasses.id && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-12 bg-lily-green rounded-full shadow-lg" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto p-10 rounded-[2.5rem] bg-lily-green text-white relative overflow-hidden group shadow-2xl shadow-lily-green/30">
              <div className="absolute -top-12 -right-12 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                <Sparkles className="w-56 h-56" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-serif font-bold mb-4">Gợi ý từ Stylist AI</h3>
                <p className="text-white/60 text-sm mb-10 leading-relaxed font-medium min-h-[4rem]">
                  {aiSuggestion || "Đang phân tích khuôn mặt của bạn để đưa ra gợi ý phù hợp nhất..."}
                </p>
                <div className="flex flex-col gap-4">
                  <button className="w-full py-5 bg-white text-lily-green rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-white/90 hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-3 shadow-xl">
                    Thêm vào giỏ hàng
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button className="w-full py-3 text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors">
                    Hướng dẫn chọn size
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-24 border-t border-lily-green/10 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
           <div className="flex flex-col gap-6">
              <h1 className="text-2xl font-serif font-bold text-lily-green">KÍNH MẮT LILY</h1>
              <p className="text-xs text-lily-green/50 leading-relaxed max-w-xs font-medium">
                Thương hiệu kính mắt hàng đầu Việt Nam, mang đến giải pháp thị lực thời trang và chất lượng cho mọi khách hàng.
              </p>
           </div>
           <div className="flex flex-col gap-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-lily-green/40">Chính sách</h4>
              <div className="flex flex-col gap-3 text-xs font-bold text-lily-green">
                 <a href="#" className="hover:translate-x-1 transition-transform">Bảo hành 1 năm</a>
                 <a href="#" className="hover:translate-x-1 transition-transform">Đổi trả 30 ngày</a>
                 <a href="#" className="hover:translate-x-1 transition-transform">Vệ sinh & Sửa chữa</a>
              </div>
           </div>
           <div className="flex flex-col gap-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-lily-green/40">Kết nối</h4>
              <div className="flex gap-6">
                 {/* Social placeholders */}
                 <div className="w-10 h-10 rounded-full border border-lily-green/10 flex items-center justify-center hover:bg-lily-green hover:text-white transition-all cursor-pointer">FB</div>
                 <div className="w-10 h-10 rounded-full border border-lily-green/10 flex items-center justify-center hover:bg-lily-green hover:text-white transition-all cursor-pointer">IG</div>
                 <div className="w-10 h-10 rounded-full border border-lily-green/10 flex items-center justify-center hover:bg-lily-green hover:text-white transition-all cursor-pointer">TT</div>
              </div>
           </div>
        </div>
        <div className="mt-20 pt-8 border-t border-lily-green/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-[9px] font-bold text-lily-green/30 uppercase tracking-[0.3em]">© 2024 KÍNH MẮT LILY. ALL RIGHTS RESERVED.</p>
           <div className="flex gap-10 text-[9px] font-bold text-lily-green/30 uppercase tracking-[0.3em]">
              <a href="#">Quyền riêng tư</a>
              <a href="#">Điều khoản sử dụng</a>
           </div>
        </div>
      </footer>

      {/* Global CSS for Canvas mirroring & Custom elements */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D1D1D1;
          border-radius: 10px;
        }
        body {
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </div>
  );
}
