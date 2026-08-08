# Brandex Project Guidelines

**Version 1.0.0**  
Engineering  
August 2026

> **Note:**  
> This document provides project-level guidelines for the Brandex trademark tracker. It includes development practices, backup procedures, and operational standards for agents and developers working on this codebase.

---

## Project Overview

Brandex is a live trademark registry for law and brand operations teams. It turns a Google Sheet into a searchable, stage-aware workspace that works from a desktop browser and a native mobile companion.

### Key Technologies
- **Frontend**: React (Expo for mobile, web for desktop)
- **Backend**: Express API server
- **Database**: PostgreSQL
- **Package Manager**: pnpm workspaces
- **Google Sheets Integration**: Google Sheets API + Apps Script

---

## Development Workflow

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- Git
- Access to Google Sheets API and Apps Script

### Setup Commands
```bash
# Install dependencies
pnpm install

# Type check libraries
pnpm run typecheck:libs

# Build API server
pnpm --filter @workspace/api-server run build

# Type check mobile app
pnpm --filter @workspace/tm-tracker-mobile run typecheck
```

### Workspace Structure
```
Brandex/
├── artifacts/
│   ├── tm-tracker-mobile/    # Primary mobile command center
│   ├── tm-tracker/           # Desktop web copy
│   └── api-server/           # Shared Express API
├── lib/                      # Shared API contracts and generated clients
└── .agents/                  # Skills and automation tools
```

---

## **CRITICAL: Backup and Git Workflow**

### Automatic Commit and Push Policy

**MANDATORY PRACTICE**: Always commit and push code to GitHub immediately after completing any work. This ensures:

1. **Continuous Backup**: All work is safely backed up to GitHub
2. **Collaboration**: Team members can access latest changes
3. **Disaster Recovery**: Protection against local machine failures
4. **Version History**: Complete audit trail of all changes

### Git Workflow

After any code changes, feature completion, or bug fixes:

```bash
# 1. Check current status
git status

# 2. Stage all changes
git add .

# 3. Commit with descriptive message
git commit -m "Your commit message here"

# 4. Push to remote immediately
git push origin main
```

### Commit Message Guidelines

- Use clear, descriptive messages starting with a verb
- Format: `[Type] Brief description`
- Types: `Add`, `Fix`, `Update`, `Refactor`, `Remove`, `Docs`
- Example: `Add search by folder number functionality`

### Pre-Commit Checklist

Before committing and pushing, ensure:
- [ ] Code follows project style guidelines
- [ ] Type checking passes (`pnpm run typecheck:libs`)
- [ ] Build succeeds (`pnpm --filter @workspace/api-server run build`)
- [ ] No console errors or warnings
- [ ] Secrets are not committed (use environment variables)
- [ ] Dependencies are updated via pnpm (not manual package.json edits)

### Branch Strategy

- **main**: Production-ready code
- **feature/**: New features
- **fix/**: Bug fixes
- **docs/**: Documentation updates

For any work outside of main:
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Work on changes...

# Commit and push feature branch
git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name

# After review and merge, return to main
git checkout main
git pull origin main
```

---

## Security Guidelines

### Never Commit Secrets
- Do not commit API keys, database credentials, or tokens
- Use Replit Secrets for environment configuration
- Required secrets:
  - `GOOGLE_SHEETS_API_KEY`
  - `GOOGLE_SHEETS_APPS_SCRIPT_URL`
  - `DATABASE_URL`
  - `DATABASE_URL_UNPOOLED` (optional, for migrations)

### Security Best Practices
- Use `pnpm audit` regularly to check for vulnerabilities
- Keep dependencies updated
- Validate data from Google Sheets before syncing
- Use the unpooled database connection only for migrations/admin tooling

---

## Code Style and Conventions

### Design Language
Brandex uses a neo-brutalist visual system:
- Warm paper backgrounds
- Black structural borders
- Orange accents
- Bold typography
- Compact data cards
- Direct operational labels

### TypeScript Guidelines
- Use TypeScript for all new code
- Enable strict type checking
- Avoid `any` types
- Use interfaces for object shapes
- Provide type safety for API contracts

### React Patterns
- Follow React composition patterns (see `.agents/skills/vercel-composition-patterns/AGENTS.md`)
- Avoid boolean prop proliferation
- Use compound components for complex UI
- Lift state into provider components
- Decouple state management from UI

---

## Testing and Quality Assurance

### Type Checking
```bash
# Check all libraries
pnpm run typecheck:libs

# Check specific workspace
pnpm --filter @workspace/tm-tracker-mobile run typecheck
```

### Building
```bash
# Build API server
pnpm --filter @workspace/api-server run build
```

### Manual Testing Checklist
- [ ] Desktop web app functions correctly
- [ ] Mobile app functions correctly
- [ ] Google Sheets sync works
- [ ] Search functionality works
- [ ] CRUD operations work
- [ ] Audit log records changes
- [ ] Dashboard displays correct data

---

## Google Sheets Integration

### Sheet Format
The sync expects columns in this order:
`DATE`, `CASE NO`, `APP NAME`, `TM NO`, `CLASS`, `STATUS`, `SUB STATUS`, `Duplicate`, `TM-11`, `Notes`, `City`

### Apps Script Setup
- Configure the Apps Script web app URL in secrets
- Ensure write-back permissions are properly set
- Test sync functionality after any changes to sync logic

---

## Troubleshooting

### Common Issues

**Type Errors**
```bash
# Run type check to identify issues
pnpm run typecheck:libs
```

**Build Failures**
```bash
# Clean install
rm -rf node_modules
pnpm install
```

**Sync Issues**
- Verify Google Sheets API key is valid
- Check Apps Script URL is correct
- Ensure sheet column order matches expected format

**Database Connection Issues**
- Verify `DATABASE_URL` is set correctly
- Check database is accessible
- Use `DATABASE_URL_UNPOOLED` for migrations only

---

## Project Contacts

- **Developer**: Nadeem (OutLawZ)
- **GitHub**: [@0utLawzz](https://github.com/0utLawzz)
- **Email**: net2outlawzz@gmail.com

---

## License

MIT License - See LICENSE file for details.

---

## Additional Documentation

- [README.md](README.md) - Project overview and setup
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community guidelines
- [SECURITY.md](SECURITY.md) - Security policy and reporting
- [React Composition Patterns](.agents/skills/vercel-composition-patterns/AGENTS.md) - React component architecture guidelines
