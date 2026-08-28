# Documentation Index Template

This template defines the `docs/README.md` file — the navigation hub for all project documentation.

**This file is ALWAYS generated.** It must exist in every project that uses this documentation skill.

---

## Template

```markdown
# {Service Name} - Documentation

This directory contains comprehensive documentation for the {service name} service, generated through static code analysis.

## Documentation Structure

- **[Project Overview](project-overview.md)** - Comprehensive project metadata and structure
- **[API Contracts](api-contracts/)** - Detailed per-endpoint documentation
- **[Architecture](architecture/)** - C4 model system architecture diagrams
- **[Sequence Diagrams](sequence-diagrams/)** - Per-flow sequence diagrams
- **[Data Models](data-models/)** - Domain models, DTOs, and ER diagrams
- **[Dependencies](dependencies/)** - Dependency graph and risk assessment
- **[Data Lineage](data-lineage/)** - Data flow documentation
- **[Infrastructure](infrastructure/)** - Deployment, environment configs, networking

## Quick Reference

**Service**: {service-name}
**Type**: {Framework} {version} Microservice
**Runtime**: {Language} {version}
**Build**: {Build tool} {Multi-Module|Single-Module} ({N} modules)
**Total Files**: {count} {language} files

---

*Documentation generated via static code analysis. No compilation or execution was performed.*
```

---

## Rules

1. **Always generated** — This file must be created for every project, regardless of size or complexity.
2. **Links must be relative** — Use `project-overview.md`, `api-contracts/`, etc. (no absolute paths).
3. **Only list sections that exist** — If `data-lineage/` was skipped (no external calls), do not list it.
4. **Quick Reference values come from build files** — Read `build.gradle`, `pom.xml`, `package.json`, etc. to extract service name, language, framework, version, and module count.
5. **Update when sections change** — When a new documentation directory is added or removed, update this file.
6. **Keep it short** — This is a navigation page, not a detailed overview. The Project Overview file handles depth.
