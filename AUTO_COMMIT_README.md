# TH+ LifeEngine - Auto-Commit & Responsive UI Setup

## ✅ Auto-Commit System

Your repository now has automatic git commit and push functionality:

### Features:
- **Auto-commit on file changes** - Watches your project and commits changes automatically
- **Auto-push after commit** - Git post-commit hook pushes changes to remote
- **Debounced commits** - Waits 5 seconds after changes to batch commits
- **Excludes generated files** - Ignores node_modules, .next, .git, and logs

### Usage:

```bash
# Manual commit and push
npm run auto-commit

# Watch for changes and auto-commit (recommended during development)
npm run watch:commit

# Run dev server + auto-commit watcher together
npm run dev:watch
```

### How it works:
1. `fswatch` monitors file changes in your project
2. After 5 seconds of inactivity, it triggers `auto-commit.sh`
3. The script adds all changes and creates a timestamped commit
4. The post-commit git hook automatically pushes to the `main` branch

### To enable auto-commit during development:
```bash
npm run dev:watch
```

This runs both the Next.js dev server and the file watcher simultaneously.

---

## 📱 Responsive UI & Auto-Scaling

Your app now includes comprehensive responsive design features:

### Features:
- **Mobile-first design** - Optimized for mobile devices
- **Fluid typography** - Text scales smoothly across all screen sizes using `clamp()`
- **Responsive grid system** - Adapts layouts from 1 to 6 columns based on viewport
- **Touch-friendly targets** - Minimum 44px touch targets on mobile
- **Auto-scaling containers** - Content adapts to viewport width
- **Performance optimized** - Lazy loading, image optimization, and caching headers

### Responsive Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

### Responsive Classes Available:
```css
/* Containers */
.container           /* Responsive max-width container */
.auto-scale         /* Full-width auto-scaling wrapper */

/* Grid System */
.grid-cols-1        /* 1 column on all devices */
.grid-cols-sm-2     /* 2 columns on tablet+ */
.grid-cols-md-3     /* 3 columns on desktop */
.grid-cols-lg-4     /* 4 columns on large screens */

/* Visibility */
.hide-mobile        /* Hidden on mobile only */
.hide-desktop       /* Hidden on desktop only */
.md:block           /* Show on tablet+ */
.md:hidden          /* Hide on tablet+ */

/* Spacing (responsive) */
.p-4, .p-6, .p-8    /* Padding scales with breakpoints */
.m-4, .mx-auto      /* Margin utilities */

/* Typography (fluid) */
.text-xs to .text-4xl  /* Fluid font sizes using clamp() */
```

### Mobile Optimizations:
- ✅ Viewport meta tag configured
- ✅ Touch-friendly 44px minimum targets
- ✅ 16px form inputs (prevents iOS zoom)
- ✅ Apple mobile web app meta tags
- ✅ Theme color for mobile browsers
- ✅ Reduced motion support

### Performance Features:
- ✅ Image optimization with WebP format
- ✅ Static asset caching (1 year)
- ✅ Gzip/Brotli compression enabled
- ✅ SWC minification for faster builds
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ DNS prefetch control

### Vercel Auto-Scaling:
Your app is configured to auto-scale on Vercel with:
- Serverless functions that scale to zero
- Edge caching for static assets
- Automatic HTTPS and CDN distribution
- Geographic edge network deployment

---

## 🚀 Quick Start

### Development with auto-commit:
```bash
npm run dev:watch
```

### Build and deploy:
```bash
npm run build
vercel --prod
```

### Manual commit:
```bash
npm run auto-commit
```

---

## 📝 Notes

- Auto-commit creates timestamps like "Auto-commit: 2025-10-22 15:30:00"
- The watcher excludes: `.git`, `node_modules`, `.next`, `*.log`
- All commits are automatically pushed to the `main` branch
- Responsive styles are globally available via `app/responsive.css`
- Mobile viewport is set to `width=device-width, initial-scale=1, maximum-scale=5`

---

## ⚙️ Configuration Files

- `scripts/auto-commit.sh` - Manual commit script
- `scripts/watch-and-commit.sh` - File watcher with debouncing
- `.git/hooks/post-commit` - Auto-push hook
- `app/responsive.css` - Responsive utility classes
- `next.config.mjs` - Performance and optimization config
- `middleware.ts` - Security and caching headers
