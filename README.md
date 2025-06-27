# MSP-API-Demo-Dashboard

A modern dashboard application built with Next.js, React, and Tailwind CSS.

## Overview

MSP-API-Demo-Dashboard is a responsive dashboard interface that provides a clean and intuitive user experience for data visualization and management. Built with modern web technologies, it offers a scalable foundation for dashboard applications.

## Features

- 🎨 Modern, responsive design with Tailwind CSS
- ⚡ Built with Next.js 15 and React 18
- 🎯 TypeScript for type safety
- 🌙 Dark mode support
- 📱 Mobile-first responsive design
- 🔧 Modular component architecture
- 🎪 shadcn/ui component library integration

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Development**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MSP-API-Demo-Dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
MSP-API-Demo-Dashboard/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── theme-provider.tsx # Theme context provider
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   └── utils.ts          # Common utilities
├── public/               # Static assets
├── next.config.mjs       # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Customization

### Styling

The project uses Tailwind CSS for styling. You can customize the design system by modifying:

- `tailwind.config.ts` - Tailwind configuration
- `app/globals.css` - Global styles and CSS variables

### Components

All UI components are built using shadcn/ui. To add new components:

```bash
npx shadcn@latest add [component-name]
```

### Theme

The application supports light and dark modes. Theme switching is handled by the `ThemeProvider` component.

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the development team

---

Built with ❤️ using Next.js and modern web technologies.
```
