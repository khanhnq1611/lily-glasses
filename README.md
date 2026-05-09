# 👓 Lily Glasses - Virtual Try-On Application

A modern web application for virtual eyeglasses try-on using AI-powered image generation with Gemini 2.5 Flash Image model.

## Features

✨ **Virtual Try-On**
- Upload your portrait photo
- Browse glasses catalog
- See how glasses look on your face in real-time
- AI-powered realistic glasses fitting

🎨 **Smart Glasses Rendering**
- Support for 8+ frame shapes (cat-eye, oval, round, square, browline, etc.)
- Multiple colors and finishes
- Realistic glass effects with shadows and reflections
- Proportional fitting to face width

🌍 **User Experience**
- Vietnamese language interface
- Responsive design for all devices
- Fast loading and performance
- Professional quality output

---

## Quick Start

### Prerequisites

- Node.js 18+ (https://nodejs.org/)
- npm 9+
- OpenRouter API key (https://openrouter.ai/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/khanhnq1611/lily-glasses.git
   cd lily-glasses
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenRouter API key:
   ```
   VITE_OPENROUTER_API_KEY=your-openrouter-api-key
   VITE_APP_URL=http://localhost:3000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser

### Get API Key

1. Visit https://openrouter.ai/
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key
5. Copy and paste into `.env` file

---

## Usage

1. **Upload Portrait:**
   - Click the upload button or drag a photo
   - Supports PNG, JPG, JPEG formats
   - Best results with front-facing, well-lit portraits

2. **Browse Glasses:**
   - Scroll through the glasses catalog
   - View specifications and details
   - Click to select a style

3. **View Try-On:**
   - Wait for AI to generate the image (5-15 seconds)
   - See yourself wearing the selected glasses
   - The original face is preserved with realistic glasses overlay

---

## Project Structure

```
lily-glasses/
├── src/
│   ├── App.tsx              # Main application component
│   ├── lib/
│   │   ├── openrouterApi.ts # OpenRouter API integration
│   │   ├── imageProcessor.ts # Canvas-based image processing
│   │   └── GlassesRenderer.ts
│   ├── constants/
│   │   └── glasses.ts       # Glasses product catalog
│   ├── components/          # React components
│   └── index.css            # Styles
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Technology Stack

- **Frontend:** React 18, TypeScript
- **Build Tool:** Vite
- **Styling:** CSS3
- **AI Model:** Google Gemini 2.5 Flash Image
- **API:** OpenRouter
- **Rendering:** HTML5 Canvas

---

## Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# TypeScript type checking
npm run lint

# Clean build artifacts
npm clean
```

---

## How It Works

### Virtual Try-On Process

1. User uploads a portrait photo
2. User selects glasses from catalog
3. App sends portrait + glasses details to Gemini 2.5 Flash Image
4. AI analyzes face features and glasses specifications
5. Generates realistic image with glasses naturally fitted
6. Returns result with:
   - Preserved original face and expression
   - Glasses positioned at natural eye level
   - Realistic shadows and reflections
   - Professional appearance

### Glasses Specifications

Each glasses style includes:
- Frame shape (cat-eye, oval, round, square, etc.)
- Color and material information
- Dimensions in centimeters
- Visual properties (thickness, reflectivity)
- Recommended face shapes and skin tones

---

## API Costs

### Gemini 2.5 Flash Image Pricing

- **Input:** $0.075 per 1M tokens
- **Output:** $0.3 per 1M tokens
- **Per try-on:** ~$0.001 - $0.005 (very affordable)
- **Monthly (1000 tries):** ~$1-5

---

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 15+
✅ Edge 90+

---

## Performance

- **Try-on generation:** 5-15 seconds
- **Canvas rendering:** <100ms
- **Bundle size:** ~512 KB (164 KB gzipped)

---

## Documentation

- [Image Generation Guide](./IMAGE_GENERATION_FIX.md) - Technical details on AI rendering
- [Quick Start Guide](./QUICK_START.md) - User-friendly getting started guide
- [Usage Guide](./USAGE.md) - How to use the application

---

## Git Workflow

### Recent Major Updates

- ✅ Switched to Gemini 2.5 Flash Image for better glasses fitting
- ✅ Improved glasses rendering with product specifications
- ✅ Added support for all frame shapes
- ✅ Browser compatibility polyfill for Canvas API
- ✅ Secure environment configuration (no API keys in git)

### Total Commits

16 commits with comprehensive changes:
- AI model optimization
- Glasses rendering improvements
- Bug fixes and compatibility updates
- Documentation and guides

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder to:**
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront
   - Firebase Hosting
   - Any static hosting provider

3. **Set environment variables** in your hosting platform:
   - `VITE_OPENROUTER_API_KEY`
   - `VITE_APP_URL`

---

## Configuration

### Environment Variables

Required in `.env`:
```
VITE_OPENROUTER_API_KEY=your-api-key
VITE_APP_URL=http://localhost:3000
```

### Build Configuration

Vite configuration in `vite.config.ts`:
- Port: 3000 (default)
- Auto open browser: Enabled
- Host: 0.0.0.0 (accessible from network)

---

## Troubleshooting

### API Key Issues
- Verify API key is in `.env` file
- Check OpenRouter account has credits
- Ensure key has image generation permissions

### Generation Timeout
- Gemini 2.5 typically takes 5-15 seconds
- Check internet connection
- Try with a different portrait

### Image Quality Issues
- Use well-lit, front-facing portraits
- Ensure face takes up 50-80% of image
- Avoid extreme angles or shadows

### Port Already in Use
- Change port in `vite.config.ts`
- Or use: `npm run dev -- --port 3001`

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Support

For issues or questions:
- Create an issue on GitHub
- Check existing documentation
- Review the troubleshooting guide

---

## Credits

- **AI Model:** Google Gemini 2.5 Flash Image
- **API Provider:** OpenRouter
- **Framework:** React + TypeScript + Vite
- **UI/UX:** Responsive Design
- **Glasses Data:** Lily Glasses Catalog

---

## Changelog

### v1.0.0 (Latest)
- ✨ Gemini 2.5 Flash Image integration
- ✨ Advanced glasses rendering system
- ✨ Full product catalog support
- ✨ Vietnamese language interface
- 🐛 Fixed glasses fitting accuracy
- 🔒 Improved security (no secrets in git)
- 📱 Responsive design improvements

---

**Made with ❤️ for the Lily Glasses community**

Visit: https://lily-glasses.app
