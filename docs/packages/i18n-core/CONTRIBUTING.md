# Contributing to @yyc3/i18n-core

Thank you for your interest in contributing! This project follows open-source principles — everyone is welcome.

## Quick Start

```bash
git clone https://github.com/YanYuCloudCube/yyc3-i18n-core.git
cd i18n-core
npm install
npm run build
npm test
```

## Development Workflow

1. Fork → Branch → Code → Test → PR
2. Branch naming: `feat/xxx` `fix/xxx` `docs/xxx`
3. One PR per concern, keep it focused

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(engine): add batch translation support
fix(cache): resolve TTL expiration bug
docs(api): update translation method signature
test(plugins): add coverage for MissingKeyReporter
```

## Code Standards

- TypeScript strict mode, 100% type coverage
- camelCase for functions/variables, PascalCase for classes/types
- JSDoc on all public APIs
- No `console.log` in production code

## Testing

```bash
npm test              # Run all 443 tests
npm run test:coverage # Generate coverage report (target: 90%+)
npm run test:watch    # Watch mode for development
```

## Before Submitting PR

- [ ] `npm run build` passes with zero errors
- [ ] `npm test` passes (443 tests)
- [ ] `npm run lint` passes with zero warnings
- [ ] New features have tests
- [ ] Public APIs have JSDoc comments

## Getting Help

- [GitHub Discussions](https://github.com/YanYuCloudCube/yyc3-i18n-core/discussions)
- [GitHub Issues](https://github.com/YanYuCloudCube/yyc3-i18n-core/issues)
- Email: team@yyc3.dev
