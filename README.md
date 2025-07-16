# Axie Studio AI Voice Assistant

A modern, production-ready voice chat application built with React, TypeScript, and ElevenLabs Conversational AI. This application provides a seamless voice interaction experience with an AI agent, featuring real-time audio processing, email capture functionality, and a beautiful responsive interface.

## 🚀 Features

### Core Functionality
- **Real-time Voice Chat**: Direct voice communication with ElevenLabs AI agent
- **WebRTC Integration**: High-quality, low-latency audio streaming
- **Microphone Permission Management**: Automatic permission handling with user-friendly prompts
- **Connection Management**: Auto-retry logic with connection status indicators
- **Email Capture**: Dual email collection system (agent-triggered and auto-popup)
- **Webhook Integration**: Automatic email forwarding to n8n webhook

### User Experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Beautiful UI**: Gradient orb with animated states and visual feedback
- **Security Indicators**: Visual confirmation of secure connections
- **Swedish Localization**: User interface in Swedish language
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance Optimized**: Code splitting, lazy loading, and optimized animations

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **Modern React**: Hooks, context, and performance optimizations
- **Tailwind CSS**: Utility-first styling with custom responsive breakpoints
- **Vite Build System**: Fast development and optimized production builds
- **ESLint Configuration**: Code quality and consistency enforcement

## 🏗️ Architecture

### Project Structure
```
src/
├── components/
│   └── EmailPopup.tsx          # Reusable email capture modal
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
├── index.css                   # Global styles and Tailwind imports
└── vite-env.d.ts              # TypeScript environment definitions

public/
└── image.png                   # Static assets

config/
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── tsconfig.app.json          # App-specific TypeScript config
├── tsconfig.node.json         # Node-specific TypeScript config
├── eslint.config.js           # ESLint configuration
└── postcss.config.js          # PostCSS configuration
```

### Key Components

#### App.tsx
The main application component that handles:
- **State Management**: Connection status, permissions, email modals
- **ElevenLabs Integration**: Conversation setup and management
- **Audio Processing**: Microphone permission and WebRTC handling
- **UI Orchestration**: Visual states and user interactions
- **Error Handling**: Connection retries and graceful degradation

#### EmailPopup.tsx
A reusable modal component featuring:
- **Dual Mode Operation**: Agent-triggered and auto-popup modes
- **Form Validation**: Email format validation with error handling
- **Webhook Integration**: Direct submission to n8n webhook
- **Accessibility**: Keyboard navigation and screen reader support
- **Loading States**: Visual feedback during submission

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### ElevenLabs Setup
1. Create an account at [ElevenLabs](https://elevenlabs.io)
2. Navigate to the Conversational AI section
3. Create or select your AI agent
4. Copy the agent ID to your `.env` file

### Webhook Configuration
The application sends emails to an n8n webhook:
```
https://stefan0987.app.n8n.cloud/webhook/803738bb-c134-4bdb-9720-5b1af902475f
```

To modify the webhook URL, update the `webhookUrl` in both:
- `App.tsx` (handleAutoEmailSubmit function)
- `EmailPopup.tsx` (handleSubmit function)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser with WebRTC support
- HTTPS connection (required for microphone access in production)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd voicechat

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your ElevenLabs agent ID

# Start development server
npm run dev
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🔒 Security Features

### Audio Security
- **Secure WebRTC**: End-to-end encrypted audio streams
- **Permission Management**: Explicit microphone permission requests
- **HTTPS Enforcement**: Secure connection requirements for production

### Data Protection
- **No Audio Storage**: Audio streams are not recorded or stored
- **Minimal Data Collection**: Only email addresses are captured
- **Secure Transmission**: All data sent over HTTPS

### Privacy Considerations
- **Transparent Permissions**: Clear explanation of microphone usage
- **User Control**: Easy connection termination and permission revocation
- **No Tracking**: No analytics or user tracking implemented

## 🎨 Styling and Theming

### Design System
- **Color Palette**: Blue/cyan gradients with emerald accents
- **Typography**: System fonts with optimized readability
- **Spacing**: 8px grid system for consistent layouts
- **Animations**: Performance-optimized with reduced motion support

### Responsive Breakpoints
```css
/* Mobile phones */
@media (max-width: 639px) { /* Tailwind sm */ }

/* Tablets */
@media (min-width: 640px) and (max-width: 1023px) { /* Tailwind md-lg */ }

/* Desktop */
@media (min-width: 1024px) { /* Tailwind lg+ */ }
```

### Custom CSS Classes
- `.animation-delay-200`: Staggered animation timing
- `.touch-manipulation`: Optimized touch interactions
- `.will-change-transform`: Performance optimization hints

## 🔧 Technical Implementation

### State Management
The application uses React hooks for state management:
- `useState`: Component-level state
- `useCallback`: Performance optimization for event handlers
- `useMemo`: Expensive computation caching
- `useEffect`: Side effects and lifecycle management

### Performance Optimizations
- **Code Splitting**: Vendor and library chunks separated
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Lazy loading and proper sizing
- **Animation Performance**: GPU acceleration and reduced motion support

### Error Handling
- **Connection Retries**: Automatic reconnection with exponential backoff
- **Graceful Degradation**: Fallback UI states for errors
- **User Feedback**: Clear error messages and recovery instructions

## 🌐 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
Ensure these environment variables are set in production:
- `VITE_ELEVENLABS_AGENT_ID`: Your ElevenLabs agent ID

### HTTPS Requirements
- Microphone access requires HTTPS in production
- Configure SSL certificates for your domain
- Update Vite configuration for HTTPS if needed

### Performance Considerations
- Enable gzip compression on your server
- Configure proper caching headers
- Use a CDN for static assets
- Monitor Core Web Vitals

## 🧪 Testing

### Manual Testing Checklist
- [ ] Microphone permission request works
- [ ] Voice connection establishes successfully
- [ ] Audio quality is clear in both directions
- [ ] Email popup appears and functions correctly
- [ ] Responsive design works on all devices
- [ ] Error states display appropriate messages
- [ ] Connection retry logic functions properly

### Browser Compatibility
- Chrome 88+ (recommended)
- Firefox 85+
- Safari 14+
- Edge 88+

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode requirements
2. Use ESLint configuration for code consistency
3. Implement proper error handling for all async operations
4. Add appropriate ARIA labels for accessibility
5. Test on multiple devices and browsers

### Code Style
- Use functional components with hooks
- Implement proper TypeScript typing
- Follow React best practices for performance
- Use semantic HTML elements
- Maintain consistent naming conventions

## 📝 API Reference

### ElevenLabs Integration
The application uses the `@elevenlabs/react` package for voice functionality:

```typescript
const conversation = useConversation({
  clientTools: { get_email },
  onConnect: () => { /* Connection established */ },
  onDisconnect: () => { /* Connection ended */ },
  onMessage: (message) => { /* Message received */ },
  onError: (error) => { /* Error occurred */ }
});
```

### Client Tools
The `get_email` tool allows the AI agent to request user email:

```typescript
const get_email = (): Promise<EmailCaptureResult> => {
  // Returns: { email: string | null, success: boolean, message: string }
};
```

## 🐛 Troubleshooting

### Common Issues

**Microphone not working:**
- Ensure HTTPS connection in production
- Check browser permissions
- Verify microphone hardware functionality

**Connection failures:**
- Verify ElevenLabs agent ID is correct
- Check network connectivity
- Ensure WebRTC is supported in browser

**Email submission errors:**
- Verify webhook URL is accessible
- Check network connectivity
- Validate email format

### Debug Mode
Enable console logging by setting:
```javascript
// In development, detailed logs are available in browser console
console.log('Debug information available in development mode');
```

## 📄 License

This project is proprietary software owned by Axie Studio. All rights reserved.

## 🔗 Links

- [Axie Studio Website](https://www.axiestudio.se)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 📞 Support

For technical support or questions about this application, please contact Axie Studio through the official website.

---

**Built with ❤️ by Axie Studio**