export interface GlassesStyle {
  id: string;
  name: string;
  
  // UI / Filter Metadata
  type: 'aviator' | 'wayfarer' | 'round' | 'rectangular' | 'cateye' | 'browline' | 'geometric';
  price: string;
  description: string;

  // Rendering Properties
  color: string; // HEX code for rendering
  displayColor: string; // Text name for UI (e.g. "Đen Bóng", "Vân Đồi Mồi")

  // Geometry (Real-world shape logic)
  frameShape: 'round' | 'square' | 'rectangle' | 'cat-eye' | 'oval' | 'aviator' | 'polygon' | 'hexagon';

  // Physical Properties
  material: 'acetate' | 'metal' | 'titanium' | 'plastic' | 'plastic-metal';
  thickness: number; // 0 to 1
  transparency: number; // 0 to 1
  reflectivity: number; // 0 to 1
  rimColor?: string; // Secondary color

  // Dimensions (cm)
  frameSize: 'S' | 'M' | 'L';
  frameWidthCm: number;
  lensWidthCm: number;
  lensHeightCm: number;
  bridgeWidthCm: number;
  templeLengthCm: number;

  // AR Tuning Parameters (Internal logic)
  widthFactor: number;
  verticalOffset: number;
  bridgeOffsetX?: number;
  bridgeOffsetY?: number;
  rotation?: number;

  // Recommendation Metadata
  suitableFaceShapes: string[];
  suitableSkinTones: string[];
  suitableStyles: string[];
  suitablePurposes: string[];
  image?: string;
}

export const GLASSES_LIST: GlassesStyle[] = [
  {
    id: 'nghialm-special',
    name: 'Lily Wellington Black',
    type: 'wayfarer', 
    color: '#000000',
    displayColor: 'Đen Tuyển',
    price: '500.000đ',
    description: 'Dòng kính Wellington cổ điển với chất liệu Acetate đen bóng. Thiết kế tối giản nhưng sang trọng với điểm nhấn là nốt ruồi kép ở góc kính.',
    widthFactor: 2.15,
    verticalOffset: 0.08,
    material: 'acetate',
    thickness: 0.8,
    reflectivity: 0.5,
    transparency: 0,
    frameSize: 'M',
    frameWidthCm: 14.2, 
    lensWidthCm: 5.1,
    lensHeightCm: 4.1,
    bridgeWidthCm: 1.9,
    templeLengthCm: 14.5,
    frameShape: 'square',
    suitableFaceShapes: ['Mặt Tròn', 'Mặt Trái Tim', 'Oval'],
    suitableSkinTones: ['sáng', 'trung bình', 'ngăm'],
    suitableStyles: ['tối giản', 'trí thức', 'thanh lịch'],
    suitablePurposes: ['đi làm', 'hằng ngày', 'thời trang'],
    image: 'https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1nwxk18yvkja4.webp',
  },
  {
    id: 'lily-ha-123',
    name: 'Lily HA-123',
    type: 'browline', 
    color: '#000000',
    displayColor: 'Đen Vàng',
    price: '560.000đ',
    description: 'Mẫu kính Lily HA-123 sở hữu thiết kế thanh mảnh, hiện đại với gọng nhựa đen phối cầu kim loại vàng sang trọng.',
    widthFactor: 2.2,
    verticalOffset: 0.05,
    material: 'plastic-metal',
    thickness: 0.5,
    reflectivity: 0.6,
    transparency: 0,
    rimColor: '#D4AF37',
    frameSize: 'M',
    frameWidthCm: 14.0,
    lensWidthCm: 5.0,
    lensHeightCm: 4.5,
    bridgeWidthCm: 2.0,
    templeLengthCm: 14.5,
    frameShape: 'oval',
    suitableFaceShapes: ['Mặt Vuông', 'Mặt Kim Cương', 'Oval'],
    suitableSkinTones: ['sáng', 'trung bình'],
    suitableStyles: ['thanh lịch', 'tri thức', 'nhẹ nhàng'],
    suitablePurposes: ['đi học', 'đi làm', 'thời trang'],
    image: 'https://product.hstatic.net/200000689681/product/3_9eebb2ea47574d43ae8f08f9b684b066_master.jpg',
  },
  {
    id: 'lily-30157',
    name: 'Lily 30157',
    type: 'geometric',
    color: '#C9A98B',
    displayColor: 'Nâu Trong',
    price: '690.000đ',
    description: 'Thiết kế gọng lục giác trong suốt phối càng kim loại, mang phong cách hiện đại và tinh tế.',
    widthFactor: 2.19,
    verticalOffset: 0.03,
    material: 'plastic-metal',
    thickness: 0.35,
    reflectivity: 0.25,
    transparency: 0.6,
    frameSize: 'M',
    frameWidthCm: 13.8,
    lensWidthCm: 5.2,
    lensHeightCm: 4.6,
    bridgeWidthCm: 1.7,
    templeLengthCm: 14.5,
    frameShape: 'hexagon',
    suitableFaceShapes: ['Mặt Tròn', 'Oval', 'Vuông'],
    suitableSkinTones: ['sáng', 'trung bình', 'ngăm'],
    suitableStyles: ['hiện đại', 'tối giản', 'thanh lịch'],
    suitablePurposes: ['đi làm', 'đi học', 'thời trang'],
    image: 'https://cdn.kinhmatlily.com/lily01/2026/1/20250922-rcmkazpi2s-1769568511000.png',
  },
  {
    id: 'lily-m6201',
    name: 'Lily M6201',
    type: 'round',
    color: '#E5D3B3',
    displayColor: 'Trà Nhạt Titanium',
    price: '690.000đ',
    description: 'Dáng Panto Retro-Modern với viền nhựa TR90 trong suốt màu trà. Càng kính Titanium-IP đen mờ siêu nhẹ, bền bỉ và sang trọng. Thông số: 50-21-145.',
    widthFactor: 2.15,
    verticalOffset: 0.05,
    material: 'titanium',
    thickness: 0.45,
    reflectivity: 0.4,
    transparency: 0.5,
    rimColor: '#000000',
    frameSize: 'M',
    frameWidthCm: 14.0,
    lensWidthCm: 5.0,
    lensHeightCm: 4.4,
    bridgeWidthCm: 2.1,
    templeLengthCm: 14.5,
    frameShape: 'oval',
    suitableFaceShapes: ['Mặt Tròn', 'Oval', 'Trái Tim', 'Vuông'],
    suitableSkinTones: ['sáng', 'trung bình', 'ngăm'],
    suitableStyles: ['Retro', 'Hiện đại', 'Thanh lịch'],
    suitablePurposes: ['đi làm', 'đi học', 'thời trang'],
    image: 'https://cdn.kinhmatlily.com/lily01/2026/1/20250911-qde1ppvghj-1769568357000.jpeg',
  },
  {
    id: 'lily-82022',
    name: 'Lily 82022',
    type: 'browline',
    color: '#000000',
    displayColor: 'Đen Bạc Browline',
    price: '520.000đ',
    description: 'Thiết kế Browline đặc trưng với viền trên nhựa đen dày và nửa dưới kim loại bạc thanh mảnh. Chuyên nghiệp, cổ điển và cực kỳ thời thượng. Ngang 14.5cm, Cao 4.2cm.',
    widthFactor: 2.25,
    verticalOffset: 0.04,
    material: 'plastic-metal',
    thickness: 0.7,
    reflectivity: 0.6,
    transparency: 0,
    rimColor: '#C0C0C0',
    frameSize: 'M',
    frameWidthCm: 14.5,
    lensWidthCm: 5.2,
    lensHeightCm: 4.2,
    bridgeWidthCm: 2.0,
    templeLengthCm: 14.2,
    frameShape: 'square',
    suitableFaceShapes: ['Mặt Tròn', 'Oval', 'Trái Tim', 'Mặt Vuông'],
    suitableSkinTones: ['sáng', 'trung bình', 'ngăm'],
    suitableStyles: ['Tri thức', 'Chuyên nghiệp', 'Cổ điển'],
    suitablePurposes: ['đi làm', 'đi tiệc', 'thời trang'],
    image: 'https://cdn.kinhmatlily.com/lily01/2026/1/20250922-delzvhufnk-1769161170000.jpeg',
  },
  {
    id: 'lily-01325',
    name: 'Lily 01325',
    type: 'cateye',
    color: '#A9A9A9',
    displayColor: 'Xám Trong Kim Loại',
    price: '460.000đ',
    description: 'Sự kết hợp tinh tế giữa dáng Cat-eye nhẹ và tròn Oval. Mặt trước nhựa xám trong (grey crystal) phối cầu và càng kim loại bạc siêu mảnh, trẻ trung và thời thượng. Thông số: 52-21-145.',
    widthFactor: 2.2,
    verticalOffset: 0.05,
    material: 'plastic-metal',
    thickness: 0.45,
    reflectivity: 0.4,
    transparency: 0.6,
    rimColor: '#C0C0C0',
    frameSize: 'M',
    frameWidthCm: 14.2,
    lensWidthCm: 5.2,
    lensHeightCm: 4.4,
    bridgeWidthCm: 2.1,
    templeLengthCm: 14.5,
    frameShape: 'cat-eye',
    suitableFaceShapes: ['Mặt Tròn', 'Oval', 'Trái Tim'],
    suitableSkinTones: ['sáng', 'trung bình', 'ngăm'],
    suitableStyles: ['Tối giản', 'Hiện đại', 'Cá tính'],
    suitablePurposes: ['đi làm', 'đi học', 'thời trang'],
    image: 'https://cdn.kinhmatlily.com/lily01/2026/1/20250922-thbdxvjxgv-1769160638000.jpeg',
  },
  {
    id: 'lily-m8319',
    name: 'Lily M8319',
    type: 'round',
    color: '#000000',
    displayColor: 'Đen Bóng Titanium Silver',
    price: '750.000đ',
    description: 'Dáng mắt Oval bo tròn (Boston) hiện đại. Chất liệu Titanium cao cấp siêu nhẹ. Thông số: 14.5-4.9-2.0.',
    widthFactor: 2.24,
    verticalOffset: 0.06,
    material: 'titanium',
    thickness: 0.3,
    reflectivity: 0.7,
    transparency: 0,
    frameSize: 'L',
    frameWidthCm: 14.5,
    lensWidthCm: 4.9,
    lensHeightCm: 2.0, // Requested specialized slim lens height
    bridgeWidthCm: 2.0,
    templeLengthCm: 14.5,
    frameShape: 'oval',
    suitableFaceShapes: ['Mặt Tròn', 'Oval', 'Trái Tim'],
    suitableSkinTones: ['sáng', 'trung bình', 'ngăm'],
    suitableStyles: ['Tri thức', 'Hiện đại', 'Thanh lịch'],
    suitablePurposes: ['đi làm', 'đi học', 'thời trang'],
    image: 'https://cdn.kinhmatlily.com/lily01/2026/1/20250911-qde1ppvghj-1769568357000.jpeg', // Fallback image similar style
  },
];
