# Essential Commands for SmartGov Development

## Development Commands
```bash
# Start all apps in development mode
npm run dev

# Start specific app
npm run dev:employee
npm run dev:admin

# Build all apps
npm run build

# Build specific app
npm run build:employee
npm run build:admin

# Lint all code
npm run lint

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

## Database Commands
```bash
# Generate migrations
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate
```

## Development Workflow
1. Always run `npm run lint` before committing
2. Use `npm run type-check` to verify TypeScript
3. Test locally with `npm run dev:employee` or `npm run dev:admin`
4. Build and test production with `npm run build`