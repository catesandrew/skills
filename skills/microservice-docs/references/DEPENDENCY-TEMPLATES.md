# Dependency Templates

Create files in `docs/dependencies/`.

---

## Dependency Graph (`dependency-graph.md`)

```markdown
# Dependency Graph

## Overview
Visual representation of dependency tree with direct and transitive dependencies.

## Dependency Graph

```mermaid
graph TD
    App[{service-name}]

    App --> Framework[{Framework} {version}]
    App --> Lib1[{library-1}<br/>{version}]
    App --> Lib2[{library-2}<br/>{version}]
    App --> Internal[{internal-lib}<br/>{version}]

    Framework --> SubDep1[{sub-dependency}]
    Framework --> SubDep2[{sub-dependency}]

    Internal --> IntDep[{internal sub-dep}]

    style App fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px
    style Framework fill:#81C784,stroke:#66BB6A,stroke-width:2px
    style Internal fill:#FFA726,stroke:#FB8C00,stroke-width:2px
```

## Dependency Tree

### Level 1: Direct Dependencies
```
{service-name}
├── {framework} {version}
├── {library-1} {version}
├── {library-2} {version}
└── {internal-lib} {version}
```

### Level 2: Key Transitive Dependencies
```
{framework} {version}
├── {transitive-1}
├── {transitive-2}
└── {transitive-3}
```

## Module Dependencies

### {Module 1}
```
{module-1}
├── {dependency-1} (scope)
└── {dependency-2} (scope)
```

## Dependency Risk Indicators

```mermaid
graph LR
    App[{service-name}]

    Dep1[{dep-1} {version}<br/>✅ Current]
    Dep2[{dep-2} {version}<br/>⚠️ Behind Latest]
    Dep3[{dep-3} {version}<br/>🔴 EOL]

    App --> Dep1
    App --> Dep2
    App --> Dep3

    style Dep1 fill:#C8E6C9,stroke:#66BB6A
    style Dep2 fill:#FFE082,stroke:#FFA000
    style Dep3 fill:#FFCDD2,stroke:#E53935
```

## Conflict Resolution

### Version Overrides
- **{library}**: Explicitly set to {version} to override {reason}

### Exclusions
- {excluded dependency} → {reason}

## Circular Dependency Check

✅ No circular dependencies detected / ⚠️ Circular dependency found: {details}

## Critical Path Dependencies

**Application Cannot Start Without**:
1. {dependency-1} ({role})
2. {dependency-2} ({role})

**Functionality Degraded Without**:
1. {dependency-3} ({role})

## Dependency Scope Distribution

| Scope | Count | Purpose |
|-------|-------|---------|
| implementation/compile | ~{n} | Runtime |
| compileOnly/provided | ~{n} | Annotation processors |
| testImplementation/test | ~{n} | Test-only |

## Cross-References
- [Internal Dependencies](./internal-dependencies.md)
- [External Dependencies](./external-dependencies.md)
- [Dependency Risk Assessment](./dependency-risk-assessment.md)

---

**Last Updated:** YYYY-MM-DD
**Dependency Tree Depth**: {n} levels
**Total Dependencies**: {n} (including transitive)
```

---

## Risk Assessment (`dependency-risk-assessment.md`)

```markdown
# Dependency Risk Assessment

## Overview
Analysis of dependency version currency, security vulnerabilities, and upgrade recommendations.

## Risk Summary Dashboard

| Risk Level | Count | Category |
|------------|-------|----------|
| 🔴 Critical | {n} | Immediate action required |
| 🟡 High | {n} | Plan upgrade soon |
| 🟠 Medium | {n} | Monitor and plan |
| 🟢 Low | {n} | Acceptable |

## Critical Risks (🔴)

### {N}. {Risk Title}
**Current**: {version}
**Latest**: {version}
**Risk**: {description}
**Impact**: {impact}

**Recommendation**:
- **Action**: {what to do}
- **Priority**: {priority}
- **Effort**: {effort level}
- **Dependencies**: {blockers}

## High Risks (🟡)
{Same format as Critical}

## Medium Risks (🟠)
{Same format}

## Low Risks (🟢)
{Same format}

## Security Vulnerability Analysis

### {CVE ID} Status
**✅ MITIGATED / ⚠️ VULNERABLE**: {description}
**Versions Affected**: {versions}
**Current Status**: {status}

## Licensing Risks

### Commercial Use Compliance
**✅ CLEAR / ⚠️ REVIEW**: {status}

## Upgrade Roadmap

### {Quarter} {Year}
- {upgrade-1}
- {upgrade-2}

### {Quarter} {Year}
- {upgrade-3}

## Compliance Checklist

- ✅ / ⚠️ {checklist item}
- ✅ / ⚠️ {checklist item}

## Action Items (Prioritized)

### Immediate (Next Sprint)
1. {action}

### Short-Term (1-3 Months)
1. {action}

### Medium-Term (3-6 Months)
1. {action}

## Cross-References
- [Dependency Graph](./dependency-graph.md)
- [Internal Dependencies](./internal-dependencies.md)
- [External Dependencies](./external-dependencies.md)

---

**Last Updated:** YYYY-MM-DD
**Next Review**: {date} (Quarterly)
**Risk Level**: {emoji} {level}
```

---

## External Dependencies (`external-dependencies.md`)

List all third-party (non-internal) libraries. Group them by category. Each dependency MUST include a **Purpose** line describing what it does and a brief note on how it's used in the project.

```markdown
# External Dependencies

## Overview
Third-party libraries with versions, licenses, and security considerations.

## {Category Name} (e.g., "Core Framework", "JSON Processing", "Caching")

### {Library Name}
**Version**: {version}
**License**: {license}
**Purpose**: {one-line description of what this library does}
**Components**: (if multiple sub-modules)
- {sub-module-1}
- {sub-module-2}

**Security**: {security status or note}
**Note**: {any override, exclusion, or special config}

## Security Analysis

### Known Vulnerabilities
**{Library} {version}**: ✅ MITIGATED / ⚠️ VULNERABLE — {description}

### License Compliance
| License | Count | Commercial Use | Distribution |
|---------|-------|----------------|--------------|
| Apache 2.0 | ~{n} | ✅ Yes | ✅ Yes |

## Upgrade Recommendations

### High Priority
1. {upgrade}

### Medium Priority
1. {upgrade}

## Exclusions

### Excluded Dependencies
- {excluded} → {reason}

---

**Last Updated:** YYYY-MM-DD
**Total External Dependencies**: {count}
**Primary License**: {license}
```

---

## Internal Dependencies (`internal-dependencies.md`)

List all team-owned / organization-internal libraries. Each dependency MUST include **Purpose**, **Usage**, and **Coupling** fields.

```markdown
# Internal Dependencies

## Overview
Comprehensive listing of all internal libraries with versions, purposes, and coupling analysis.

## {Category Name} (e.g., "Core Platform", "Domain-Specific")

### {Library Name}
**Version**: `{version}`
**Type**: {BOM | Library | Client}
**Purpose**: {what this library provides}
**Scope**: {implementation | compileOnly | testImplementation}
**Usage**: {where/how it's used in this codebase}
**Coupling**: {High | Medium | Low} — {why}

## Dependency Analysis

### Version Management Strategy
**Approach**: {strategy, e.g., Git commit SHAs as versions}

### Tight Coupling Risk
**High Coupling**:
1. {library}: {reason}

## Module Publishing
**Published to Maven**:
- `common` module → `{service}-common`
- `client` module → `{service}-client`

## Upgrade Considerations
### When to Upgrade
**Triggers**: security vulnerabilities, bug fixes, new features, breaking API changes

---

**Last Updated:** YYYY-MM-DD
**Total Internal Dependencies**: {count}
**Versioning**: {strategy}
```

---

## Guidelines

1. **Read build files**: Extract all dependencies from `build.gradle`, `pom.xml`, `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`
2. **Check versions**: Note current version vs latest available
3. **Identify risks**: Flag EOL frameworks, known CVEs, major version gaps
4. **Check licenses**: Verify all runtime dependencies are commercially compatible
5. **Map transitive deps**: Identify key transitive dependencies that could cause issues
6. **ALWAYS include Purpose**: Every dependency entry MUST have a **Purpose** line explaining what it does — even if it seems obvious (e.g., "Application logging framework" for Log4j2)
7. **ALWAYS include Usage for internal deps**: Internal dependencies MUST have a **Usage** line describing where in the codebase they are used (e.g., "Session lifecycle models used in CreateSessionService")
8. **Group by category**: Group dependencies into meaningful categories (Core Framework, Serialization, Caching, Logging, Utilities, Testing, Build & Quality, etc.)
