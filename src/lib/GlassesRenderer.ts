import { GlassesStyle } from "../constants/glasses";

export function drawGlasses(
  ctx: CanvasRenderingContext2D,
  points: { leftEye: { x: number; y: number }; rightEye: { x: number; y: number }; bridge: { x: number; y: number } },
  style: GlassesStyle,
  canvasWidth: number,
  canvasHeight: number
) {
  const { leftEye, rightEye, bridge } = points;

  // Calculate parameters
  const dx = (rightEye.x - leftEye.x) * canvasWidth;
  const dy = (rightEye.y - leftEye.y) * canvasHeight;
  const eyeDistance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const centerX = bridge.x * canvasWidth + (style.bridgeOffsetX || 0) * eyeDistance;
  const centerY = bridge.y * canvasHeight + (style.verticalOffset * eyeDistance) + (style.bridgeOffsetY || 0) * eyeDistance;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle + (style.rotation || 0) * (Math.PI / 180));

  const gWidth = eyeDistance * style.widthFactor;
  const gHeight = gWidth * (style.lensHeightCm / style.frameWidthCm);

  // 1. Add Drop Shadow for depth
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = eyeDistance * 0.05;
  ctx.shadowOffsetX = eyeDistance * 0.02;
  ctx.shadowOffsetY = eyeDistance * 0.03;

  const renderColor = style.color === 'transparent' ? 'rgba(200, 200, 200, 0.4)' : style.color;

  // 1. Dynamic Lighting (simulating top-left source)
  const lightGradient = ctx.createLinearGradient(-gWidth/2, -gHeight/2, gWidth/2, gHeight/2);
  lightGradient.addColorStop(0, adjustColor(renderColor, 50)); // Lighter on top-left
  lightGradient.addColorStop(0.5, renderColor);
  lightGradient.addColorStop(1, adjustColor(renderColor, -50)); // Darker on bottom-right

  ctx.strokeStyle = lightGradient;
  // Use thickness property to adjust line width, base 0.02 + variable 0.03
  ctx.lineWidth = gWidth * (0.01 + 0.04 * (style.thickness ?? 0.5));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw generic frame shapes based on type
  ctx.beginPath();
  if (style.type === 'aviator') {
    drawAviator(ctx, gWidth, gHeight, renderColor);
  } else if (style.type === 'wayfarer') {
    drawWayfarer(ctx, gWidth, gHeight, renderColor);
  } else if (style.type === 'round') {
    drawRound(ctx, gWidth, gHeight, renderColor);
  } else if (style.type === 'rectangular') {
    drawRectangular(ctx, gWidth, gHeight, renderColor);
  } else if (style.type === 'browline') {
    drawBrowline(ctx, gWidth, gHeight, renderColor);
  } else if (style.type === 'cateye') {
    drawCateye(ctx, gWidth, gHeight, renderColor);
  } else if (style.type === 'geometric') {
    drawGeometric(ctx, gWidth, gHeight, renderColor);
  }

  ctx.stroke();

  // 2. Clear shadow for lenses and highlights
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw lenses (semi-transparent)
  ctx.fillStyle = renderColor.startsWith('#') ? `${renderColor}22` : 'rgba(255, 255, 255, 0.1)'; 
  ctx.fill();

  // 3. Add Lens Glint & Material Reflectivity
  drawLensGlint(ctx, gWidth, gHeight, style.reflectivity ?? 0.5);

  // 4. Add Material Metal/Acetate shine
  if (style.material === 'titanium' || style.material === 'metal') {
    addMaterialShine(ctx, gWidth, gHeight);
  }

  ctx.restore();
}

function adjustColor(hex: string, amt: number) {
  if (hex === 'transparent' || !hex.startsWith('#')) return hex;
  let usePound = false;
  if (hex[0] === "#") {
    hex = hex.slice(1);
    usePound = true;
  }
  const num = parseInt(hex, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255; else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255; else if (g < 0) g = 0;
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function addMaterialShine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const shine = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.45, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.4)');
  shine.addColorStop(0.55, 'rgba(255,255,255,0)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.restore();
}

function drawLensGlint(ctx: CanvasRenderingContext2D, w: number, h: number, reflectivity: number) {
  const bridgeW = w * 0.12;
  const lensW = w * 0.44;
  
  // High fidelity glint
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + reflectivity * 0.3})`;
  ctx.lineWidth = w * 0.015;
  ctx.beginPath();
  
  // Primary Reflection on left lens
  ctx.moveTo(-bridgeW / 2 - lensW * 0.8, -h * 0.15);
  ctx.lineTo(-bridgeW / 2 - lensW * 0.4, -h * 0.45);
  
  // Accent Reflection on left lens
  ctx.moveTo(-bridgeW / 2 - lensW * 0.9, -h * 0.05);
  ctx.lineTo(-bridgeW / 2 - lensW * 0.7, -h * 0.25);
  
  // Primary Reflection on right lens
  ctx.moveTo(bridgeW / 2 + lensW * 0.2, -h * 0.15);
  ctx.lineTo(bridgeW / 2 + lensW * 0.5, -h * 0.45);
  
  // Accent Reflection on right lens
  ctx.moveTo(bridgeW / 2 + lensW * 0.1, -h * 0.05);
  ctx.lineTo(bridgeW / 2 + lensW * 0.3, -h * 0.25);
  
  ctx.stroke();

  // Subtle gradient highlight for the "depth" of the lens
  const radialGlint = ctx.createRadialGradient(0, -h*0.3, 0, 0, -h*0.3, w*0.5);
  radialGlint.addColorStop(0, `rgba(255, 255, 255, ${reflectivity * 0.15})`);
  radialGlint.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = radialGlint;
  ctx.fill();
}

function drawAviator(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const lensW = w * 0.42;
  const lensH = h * 1.1;
  const bridgeW = w * 0.16;

  // Left Lens
  drawLens(ctx, -bridgeW / 2 - lensW / 2, 0, lensW, lensH, 0.4);
  // Right Lens
  drawLens(ctx, bridgeW / 2 + lensW / 2, 0, lensW, lensH, 0.4);
  
  // Bridge lines
  ctx.beginPath();
  ctx.moveTo(-bridgeW / 2, -lensH * 0.2);
  ctx.lineTo(bridgeW / 2, -lensH * 0.2);
  ctx.moveTo(-bridgeW / 2, -lensH * 0.4);
  ctx.lineTo(bridgeW / 2, -lensH * 0.4);
  ctx.stroke();
}

function drawWayfarer(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const lensW = w * 0.45;
  const lensH = h * 1.1; // Balanced for Wellington/Wayfarer height
  const bridgeW = w * 0.1;

  ctx.beginPath();
  // Left Lens - Wellington shape: squarish with rounded bottom
  ctx.roundRect(-bridgeW / 2 - lensW, -lensH * 0.45, lensW, lensH, [lensW * 0.1, lensW * 0.1, lensW * 0.45, lensW * 0.45]);
  // Right Lens
  ctx.roundRect(bridgeW / 2, -lensH * 0.45, lensW, lensH, [lensW * 0.1, lensW * 0.1, lensW * 0.45, lensW * 0.45]);
  
  // Bridge - keyhole or solid wellington bridge
  ctx.moveTo(-bridgeW / 2, -lensH * 0.1);
  ctx.quadraticCurveTo(0, -lensH * 0.2, bridgeW / 2, -lensH * 0.1);
  ctx.stroke();

  // Silver Pins Decoration (Special for NghiaLM and high-end wellingtons)
  ctx.fillStyle = '#E5E5E5'; // Silver/Nickel color
  const pinSize = w * 0.006;
  const pinOffset = w * 0.015;

  // Left Pins
  ctx.beginPath();
  ctx.arc(-bridgeW / 2 - lensW + pinOffset, -lensH * 0.35, pinSize, 0, Math.PI * 2);
  ctx.arc(-bridgeW / 2 - lensW + pinOffset + pinSize * 2.5, -lensH * 0.35, pinSize, 0, Math.PI * 2);
  // Right Pins
  ctx.arc(bridgeW / 2 + lensW - pinOffset, -lensH * 0.35, pinSize, 0, Math.PI * 2);
  ctx.arc(bridgeW / 2 + lensW - pinOffset - pinSize * 2.5, -lensH * 0.35, pinSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawRound(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const lensW = w * 0.44;
  const lensH = h * 1.05;
  const bridgeW = w * 0.12;

  // Left Lens
  ctx.ellipse(-bridgeW / 2 - lensW / 2, 0, lensW / 2, lensH / 2, 0, 0, Math.PI * 2);
  // Right Lens
  ctx.moveTo(bridgeW / 2 + lensW, 0);
  ctx.ellipse(bridgeW / 2 + lensW / 2, 0, lensW / 2, lensH / 2, 0, 0, Math.PI * 2);
  
  // Bridge
  ctx.moveTo(-bridgeW / 2, 0);
  ctx.quadraticCurveTo(0, -lensH * 0.2, bridgeW / 2, 0);
}

function drawRectangular(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const lensW = w * 0.45;
  const lensH = h * 1.0;
  const bridgeW = w * 0.1;

  ctx.roundRect(-bridgeW / 2 - lensW, -lensH / 2, lensW, lensH, lensH * 0.1);
  ctx.roundRect(bridgeW / 2, -lensH / 2, lensW, lensH, lensH * 0.1);
  // Bridge
  ctx.moveTo(-bridgeW / 2, 0);
  ctx.lineTo(bridgeW / 2, 0);
}

function drawBrowline(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const lensW = w * 0.45;
  const lensH = h * 0.85;
  const bridgeW = w * 0.12;

  // 1. Upper thick part (Acetate/Plastic)
  ctx.strokeStyle = color;
  ctx.lineWidth = w * 0.045;
  
  // Left upper
  ctx.beginPath();
  ctx.roundRect(-bridgeW / 2 - lensW, -lensH / 2, lensW, lensH * 0.35, [w * 0.02, w * 0.02, 0, 0]);
  ctx.stroke();

  // Right upper
  ctx.beginPath();
  ctx.roundRect(bridgeW / 2, -lensH / 2, lensW, lensH * 0.35, [w * 0.02, w * 0.02, 0, 0]);
  ctx.stroke();

  // 2. Lower thin part (Metal rim)
  ctx.strokeStyle = color === '#1a1a1a' ? '#666' : color; // Use lighter/metallic color for rim
  ctx.lineWidth = w * 0.01;
  
  // Left rim
  ctx.beginPath();
  ctx.roundRect(-bridgeW / 2 - lensW, -lensH / 2, lensW, lensH, [w * 0.02, w * 0.02, lensW * 0.4, lensW * 0.4]);
  ctx.stroke();

  // Right rim
  ctx.beginPath();
  ctx.roundRect(bridgeW / 2, -lensH / 2, lensW, lensH, [w * 0.02, w * 0.02, lensW * 0.4, lensW * 0.4]);
  ctx.stroke();

  // 3. Luxury Gold Bridge
  ctx.strokeStyle = '#D4AF37'; // Gold color
  ctx.lineWidth = w * 0.02;
  ctx.beginPath();
  ctx.moveTo(-bridgeW / 2, -lensH * 0.1);
  ctx.quadraticCurveTo(0, -lensH * 0.25, bridgeW / 2, -lensH * 0.1);
  ctx.stroke();
  
  // Decorative Gold accents on corners
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(-bridgeW / 2 - lensW * 0.9, -lensH * 0.35, w * 0.008, 0, Math.PI * 2);
  ctx.arc(bridgeW / 2 + lensW * 0.9, -lensH * 0.35, w * 0.008, 0, Math.PI * 2);
  ctx.fill();
}

function drawCateye(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const lensW = w * 0.42;
  const lensH = h * 0.8;
  const bridgeW = w * 0.16;

  // Left Lens
  ctx.beginPath();
  ctx.moveTo(-bridgeW / 2, -lensH * 0.2);
  ctx.bezierCurveTo(-bridgeW / 2 - lensW * 0.1, -lensH * 0.6, -bridgeW / 2 - lensW, -lensH * 0.8, -bridgeW / 2 - lensW * 1.1, -lensH * 0.5);
  ctx.bezierCurveTo(-bridgeW / 2 - lensW * 1.1, 0, -bridgeW / 2 - lensW * 0.5, lensH * 0.5, -bridgeW / 2, lensH * 0.2);
  ctx.closePath();
  ctx.stroke();

  // Right Lens
  ctx.beginPath();
  ctx.moveTo(bridgeW / 2, -lensH * 0.2);
  ctx.bezierCurveTo(bridgeW / 2 + lensW * 0.1, -lensH * 0.6, bridgeW / 2 + lensW, -lensH * 0.8, bridgeW / 2 + lensW * 1.1, -lensH * 0.5);
  ctx.bezierCurveTo(bridgeW / 2 + lensW * 1.1, 0, bridgeW / 2 + lensW * 0.5, lensH * 0.5, bridgeW / 2, lensH * 0.2);
  ctx.closePath();
  ctx.stroke();

  // Bridge
  ctx.beginPath();
  ctx.moveTo(-bridgeW / 2, -lensH * 0.1);
  ctx.quadraticCurveTo(0, -lensH * 0.3, bridgeW / 2, -lensH * 0.1);
  ctx.stroke();
}

function drawGeometric(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const lensW = w * 0.44;
  const lensH = h * 0.9;
  const bridgeW = w * 0.12;

  // Function to draw a hexagon
  const drawHex = (centerX: number, centerY: number, width: number, height: number) => {
    ctx.beginPath();
    const halfW = width / 2;
    const halfH = height / 2;
    const peak = width * 0.15;

    ctx.moveTo(centerX - halfW, centerY);
    ctx.lineTo(centerX - halfW + peak, centerY - halfH);
    ctx.lineTo(centerX + halfW - peak, centerY - halfH);
    ctx.lineTo(centerX + halfW, centerY);
    ctx.lineTo(centerX + halfW - peak, centerY + halfH);
    ctx.lineTo(centerX - halfW + peak, centerY + halfH);
    ctx.closePath();
    ctx.stroke();
  };

  // Left Hex
  drawHex(-bridgeW / 2 - lensW / 2, 0, lensW, lensH);
  // Right Hex
  drawHex(bridgeW / 2 + lensW / 2, 0, lensW, lensH);

  // Bridge
  ctx.beginPath();
  ctx.moveTo(-bridgeW / 2, 0);
  ctx.lineTo(bridgeW / 2, 0);
  ctx.stroke();
}

function drawLens(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, round: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}
