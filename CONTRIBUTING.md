# Contributing to Brandex

Thank you for your interest in contributing to Brandex! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Git
- A GitHub account

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Brandex.git
   cd Brandex
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Project

```bash
# Install dependencies
pnpm install

# Type check libraries
pnpm run typecheck:libs

# Build the API server
pnpm --filter @workspace/api-server run build

# Type check mobile app
pnpm --filter @workspace/tm-tracker-mobile run typecheck
```

### Making Changes

1. Make your changes following the project's code style and conventions
2. Test your changes thoroughly
3. Run type checking and build commands to ensure no errors
4. Commit your changes with a clear, descriptive message

### Commit Guidelines

- Use clear, descriptive commit messages
- Start with a verb in the imperative mood (e.g., "Add", "Fix", "Update")
- Keep the first line under 50 characters
- Add detailed description if necessary after a blank line

Example:
```
Add search by folder number

Implement search functionality for folder numbers in the
trademark tracker to improve data discovery.
```

## Pull Request Process

1. Ensure your code is properly formatted and passes all checks
2. Update documentation if needed
3. Write clear descriptions of your changes in the PR
4. Reference any related issues
5. Wait for code review and address feedback

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Changes are tested locally
- [ ] Type checking passes (`pnpm run typecheck:libs`)
- [ ] Build succeeds (`pnpm --filter @workspace/api-server run build`)
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive

## Project Structure

```
Brandex/
├── artifacts/
│   ├── tm-tracker-mobile/    # Primary mobile command center
│   ├── tm-tracker/           # Desktop web copy
│   └── api-server/           # Shared Express API
├── lib/                      # Shared API contracts and generated clients
└── .agents/                  # Skills and automation tools
```

## Code Style

- Follow existing code patterns and conventions
- Use TypeScript for type safety
- Maintain the neo-brutalist design language where applicable
- Write clean, readable code with meaningful variable names

## Testing

Before submitting a PR, ensure:
- Type checking passes
- Build commands succeed
- Manual testing of new features
- No console errors or warnings

## Questions or Issues?

If you have questions or encounter issues:
- Check existing issues and discussions
- Create a new issue with detailed information
- Join community discussions for general questions

## License

By contributing to Brandex, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

Please be respectful and constructive in all interactions. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.
