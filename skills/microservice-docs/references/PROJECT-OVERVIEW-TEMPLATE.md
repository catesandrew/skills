# Project Overview Template

Create as `docs/project-overview.md`.

---

## Template

```markdown
# {Service Name} - Project Overview

## Project Metadata

**Project Name**: {service-name}
**Type**: {Spring Boot Microservice / Express API / FastAPI Service / etc.}
**Build System**: {Gradle / Maven / npm / pip / Cargo} {Multi-Module if applicable}
**Language**: {Java 17 / TypeScript 5.x / Python 3.12 / Go 1.21 / Rust 1.75}
**Framework**: {Spring Boot 3.2 / Express 4.x / FastAPI 0.100+ / Gin 1.9}
**Total Source Files**: {count}
**Module Count**: {count} ({module-1}, {module-2}, ...)

## Module Structure

### 1. {Module Name} (`{directory}`)
**Purpose**: {one-line purpose}

**Key Components**:
- **{Package/Directory}** (`{full.package.or.path}`)
  - {Component 1} ({brief description})
  - {Component 2}
- **{Package/Directory}** (`{full.package.or.path}`)
  - {Component 3}
  - {Component 4}

**Dependencies**: {what this module depends on}

### 2. {Module Name} (`{directory}`)
**Purpose**: {one-line purpose}

**Key Packages**:
- **Controller Layer** ({count} controllers)
  - `{ControllerName}` - {purpose}
- **Service Layer** ({count} services)
  - `{ServiceName}` - {purpose}
- **Mapper Layer** ({count} mappers)
  - {description}
- **Filter Layer**
  - {description}
- **Configuration Layer**
  - {description}
- **External Client Layer**
  - `{ClientName}` ({target service})

**Dependencies**: {what this module depends on}

### 3. {Module Name} (`{directory}`)
**Purpose**: {one-line purpose}

**Key Components**:
- `{ClassName}` - {purpose}

**Dependencies**: {what this module depends on}

## Technology Stack

### Core Frameworks
- **{Framework}**: {version}
- **{HTTP Client/Server}**: {version and details}
- **{Language}**: {version}
- **{Build Tool}**: {version}

### Data Binding / Serialization
- **{Library}**: {version} ({purpose})

### Logging & Monitoring
- **{Logging framework}**: {version}
- **{Metrics library}**: {purpose}
- **{Tracing library}**: {purpose}

### Cloud / Infrastructure Integration
- **{Cloud SDK}**: {purpose}
- **{IAM}**: {description}

### Utilities
- **{Library}**: {version}

### Testing
- **{Test framework}**: {version}
- **{Mock library}**: {version}

### Build & Quality
- **{Formatter}**: {version}
- **{Coverage tool}**: {version}
- **{Quality gate}**: {version}
- **{Artifact repo}**: {description}

### Internal Dependencies
- **{internal-lib}**: {version} - {purpose}

## Deployment Model

### Service Discovery
{How services find each other - K8s DNS, Consul, direct URLs}

Example:
- `{service-url-pattern}` ({Service Name})

### External Access
- {Ingress URL pattern}
- {Mock/test URL pattern if applicable}

### Health Checks
- Endpoint: `{path}`
- {Additional health details}

### Server Configuration
- **Threads**: {configurable via} (default: {value})
- **Port**: {port}
- **Max header/payload size**: {value}

## REST API Endpoints

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | {METHOD} | `{path}` | {description} |
| 2 | {METHOD} | `{path}` | {description} |
| 3 | {METHOD} | `{path}` | {description} |

**API Versions Supported**: {versions}

## External Integrations

### {Integration Category 1}
1. **{Integration Name}**
   - {Resource identifier}: `{pattern}`
   - {Region/location}: {value}
   - Purpose: {description}
   - {Refresh/sync frequency if applicable}

### {Integration Category 2}
- **Host**: {host}
- **Path**: `{path}`
- **Protocol**: {HTTPS/gRPC}

## Environment Configuration

### Profiles
- **Environment profiles**: {list}
- **Core profile**: {description}
- **Region-specific**: {pattern}

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{VAR}` | {description} | `{example}` |

### Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `{flag}` | {value} | {description} |

## Connection Configuration

| Target | Connection Timeout | Read Timeout | Pool Size |
|--------|-------------------|-------------|-----------|
| {service} | {value}ms | {value}ms | {value} |

## Build Configuration

### Version Strategy
- **Main branch**: `{pattern}`
- **Feature branches**: `{pattern}`
- **Local**: `{value}`

### Repository Configuration
- {Repository 1}
- {Repository 2}

### Exclusions
- {Excluded dependency}: {reason}

### Dependency Overrides
- **{Library}**: {version} ({reason for override})

## Test Configuration

### Execution
- **Parallel**: {strategy}
- **Framework**: {test framework}
- **Coverage**: {tool and output}

### Test Environment Variables
| Variable | Value |
|----------|-------|
| `{VAR}` | `{value}` |

## Analysis Methodology

This overview was generated through static code analysis of:
- Build configuration files ({list files})
- Application configuration files ({list files})
- Source file package structure and annotations
- Controller endpoint mappings
- Service layer dependencies
- External client configurations

**No code compilation, building, or execution was performed during this analysis.**

## Next Steps

For detailed documentation, refer to:
- [API Contracts](api-contracts/) - Endpoint documentation
- [Architecture](architecture/) - System architecture (C4 model)
- [Sequence Diagrams](sequence-diagrams/) - Flow diagrams
- [Data Models](data-models/) - Domain models and schemas
- [Dependencies](dependencies/) - Dependency analysis
- [Data Lineage](data-lineage/) - Data flow documentation
- [Infrastructure](infrastructure/) - Deployment configuration

---

**Last Updated:** YYYY-MM-DD
**Total Source Files**: {count}
**Modules**: {count}
```

## Guidelines

1. **Start here**: This is the first document to generate - it provides the foundation for all others
2. **Read build files first**: `build.gradle`, `pom.xml`, `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`
3. **Scan source structure**: Use file listing to count files, identify modules, map packages
4. **Extract from config**: Read all YAML/properties/env files for environment and connection details
5. **Count precisely**: Provide actual counts of controllers, services, source files - not estimates
6. **List real technologies**: Only include dependencies that actually appear in build files
7. **Analysis note**: Always include the "Analysis Methodology" section stating static analysis only
