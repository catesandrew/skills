# Data Lineage Templates

Create files in `docs/data-lineage/`.

---

## Data Lineage Graph (`data-lineage-graph.md`)

```markdown
# Data Lineage Graph

## Overview
Comprehensive flowchart showing all data IN (API requests, external sources) and data OUT (responses, external service calls) with specific field names.

## Data Lineage Flowchart

```mermaid
graph TB
    subgraph Data_IN[Data Sources - Upstream]
        ClientReq[Client API Requests]
        ClientFields[field-1<br/>field-2<br/>field-3<br/>nested.field-4]
    end

    subgraph Service_Layer[{Service Name} - Transformations]
        Mapper1[Mapper1Name]
        Mapper2[Mapper2Name]
        Filter1[FilterName]
        Enricher1[EnricherName]
    end

    subgraph Data_OUT[Data Sinks - Downstream]
        ClientResp[Client API Responses]
        ClientRespFields[response-field-1<br/>response-field-2]

        ExtServices[External Service Calls]
        ExtFields[service-1:<br/>  field-a, field-b<br/>service-2:<br/>  field-c, field-d]
    end

    ClientReq --> ClientFields
    ClientFields --> Mapper1
    ClientFields --> Mapper2

    Mapper1 --> ExtServices
    Mapper2 --> Filter1
    Filter1 --> Enricher1
    Enricher1 --> ClientResp

    ClientResp --> ClientRespFields
    ExtServices --> ExtFields

    style Service_Layer fill:#E3F2FD,stroke:#2196F3,stroke-width:2px
    style Data_IN fill:#C8E6C9,stroke:#66BB6A,stroke-width:2px
    style Data_OUT fill:#FFE0B2,stroke:#FF9800,stroke-width:2px
```

## Data Flow Overview

### Data IN (Upstream Sources)

#### 1. Client API Requests
**Source**: {client types}
**Protocol**: {HTTP/gRPC/WebSocket}
**Format**: {JSON/XML/Protobuf}

**Key Fields Captured**:
- **Category 1**: field-1, field-2
- **Category 2**: field-3, field-4
- **Category 3**: field-5

### Data OUT (Downstream Sinks)

#### 1. Client API Responses
**Destination**: Original requesting client
**Format**: {JSON/XML}

**Key Fields Returned**:
- **Category 1**: response-field-1, response-field-2

#### 2. External Service Calls
**Destinations**: {service-1}, {service-2}

**{service-1}**:
- **Outbound**: field-a, field-b
- **Inbound**: result-a, result-b

#### 3. Storage Writes *(if applicable)*
**Destination**: {database/cache/S3}
- **Data written**: {fields}

## Transformation Layers

### Layer 1: {MapperName}
**Input**: {InputType}
**Output**: {OutputType}
**Transformations**:
- input.field-1 → output.mapped-field-1
- input.field-2 → output.mapped-field-2
- input.field-3 → derived.computed-field (business logic)

### Layer 2: {FilterName}
**Input**: {raw data}
**Output**: {filtered data}
**Transformations**:
- IF condition THEN remove/redact field
- Apply {business rule}

### Layer 3: {EnricherName}
**Input**: {base data}
**Output**: {enriched data}
**Enrichment**:
- Add generated-id (UUID)
- Add computed-url (from config + id)
- Add timestamp

## Data Enrichment

### Metadata Added by Service
- {field}: {how it's generated}

### Business Logic Applied
1. **{Rule Name}**: {description}
2. **{Rule Name}**: {description}

## Data Loss Points

### Intentional Filtering
1. **Privacy**: {what is filtered and why}
2. **Security**: {what is redacted}
3. **Internal**: {internal fields not exposed}

### No Unintentional Loss
All input fields either passed through, transformed, or intentionally filtered.

## Cross-References
- [Upstream Data Flows](./upstream-data-flows.md) - Input sources
- [Downstream Data Flows](./downstream-data-flows.md) - Output destinations
- [Data Models](../data-models/) - DTO definitions
- [Sequence Diagrams](../sequence-diagrams/) - Flow context

---

**Last Updated:** YYYY-MM-DD
**Mappers Analyzed**: {count}
**Data Sources**: {count}
**Data Sinks**: {count}
```

---

## Upstream Data Flows (`upstream-data-flows.md`)

```markdown
# Upstream Data Flows

## Overview
All data sources that feed into {service-name}.

## Data Sources

### 1. {Source Name}
**Type**: {API Request / Message Queue / Database Read / S3 / Config}
**Protocol**: {HTTPS/gRPC/AMQP/JDBC}
**Format**: {JSON/XML/Protobuf/Binary}

**Fields Received**:

| Field | Type | Required | Description | Used By |
|-------|------|----------|-------------|---------|
| `field-name` | string | Yes | {desc} | {MapperName} |

**Validation Applied**:
- {validation rule}

### 2. {Source Name}
{Same format}

## Source Reliability

| Source | SLA | Timeout | Fallback |
|--------|-----|---------|----------|
| {source} | {SLA} | {timeout}ms | {fallback strategy} |

---

**Last Updated:** YYYY-MM-DD
**Total Upstream Sources**: {count}
```

---

## Downstream Data Flows (`downstream-data-flows.md`)

```markdown
# Downstream Data Flows

## Overview
All data destinations that {service-name} sends data to.

## Data Destinations

### 1. {Destination Name}
**Type**: {API Response / Service Call / Database Write / Message Publish / S3 Write}
**Protocol**: {HTTPS/gRPC/AMQP/JDBC}
**Format**: {JSON/XML}

**Fields Sent**:

| Field | Type | Source Field | Transformation |
|-------|------|-------------|----------------|
| `output-field` | string | `input-field` | {mapper/direct/computed} |

**Field-Level Mapping**:
- `input.field-a` → `output.mapped-a` (via {MapperName})
- `input.field-b` + `input.field-c` → `output.computed-d` (business logic)

### 2. {Destination Name}
{Same format}

---

**Last Updated:** YYYY-MM-DD
**Total Downstream Destinations**: {count}
```

## Guidelines

1. **Identify all mappers**: Search codebase for mapper/transformer/converter classes
2. **Trace field flows**: For each input field, trace where it ends up in the output
3. **Document privacy filtering**: Explicitly note any PII redaction or data minimization
4. **Show enrichment**: Document any fields the service generates (UUIDs, timestamps, computed values)
5. **Note data loss**: Distinguish intentional filtering from potential bugs
