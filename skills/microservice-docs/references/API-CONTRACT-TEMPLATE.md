# API Contract Template

Use this template for each API endpoint. Create one file per endpoint (or tightly coupled endpoint group) in `docs/api-contracts/`.

## File Naming Convention

`{resource}-{action}-api.md`

Examples: `create-session-api.md`, `get-pod-api.md`, `invariant-qualification-api.md`

---

## Required Heading Structure

The headings below MUST appear in this exact order. Omit a section only if it truly does not apply.

```
# API Contract: {Endpoint Name}
## Endpoint Information
## Description
## API Versions Supported
## Path Parameters           ← omit if none
## Query Parameters          ← omit if none
## Request Headers
## Request Body
  ### Schema
  ### Required Fields
  ### Validation Rules
  ### Example Request
## Response
  ### Success Response ({code} {text})
  ### Error Responses
    #### {code} {text}
    #### {code} {text}
## CORS Configuration        ← omit if not applicable
## Authentication & Authorization
## Service Dependencies
  ### Downstream Services (via Kubernetes)
## Data Flow
## Privacy & Compliance
## Monitoring & Tracing
## Testing
## Notes
```

---

## Template

```markdown
# API Contract: {Endpoint Name}

## Endpoint Information

**HTTP Method**: `{GET|POST|PUT|PATCH|DELETE}`
**Path**: `{path with parameters}`
**Full URL Pattern**: `https://{host}/{path}`
**Kubernetes Service**: `http://{k8s-service-name}.{namespace}.svc.cluster.local/{path}`

## Description

{1-2 sentence description of what this endpoint does.}

This endpoint {performs the following | initializes the pipeline by}:
1. {Step 1 of the pipeline}
2. {Step 2}
3. {Step 3}
4. {Step 4}

## API Versions Supported

- `v1`
- `v2`
- `v3`

## Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `{name}` | string | Yes | {description} | `{example}` |

**Valid Values**: `{value1}`, `{value2}`

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `{name}` | string | No | {description} | `{example}` |

## Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Content-Type` | string | Yes | Must be `application/json` |
| `Accept` | string | Yes | Must be `application/json` |
| `Authorization` | string | No | Bearer token (if applicable) |

## Request Body

**Content-Type**: `application/json`

### Schema

```json
{
  "field1": "string (type_hint)",
  "nested": {
    "field2": "string (required)",
    "field3": "integer"
  }
}
```

### Required Fields

- `field1` (string, required): Description
- `nested` (object, required)
  - `nested.field2` (string, required): Description

### Validation Rules

1. **Either/Or Requirements**:
   - Either `fieldA` OR `fieldB` must be present

2. **Conditional Requirements** (based on context):
   - If `fieldC` is X: Requires `fieldD`
   - For specific apps/publishers: Requires additional fields

3. **Format Validations**:
   - `fieldE`: Must match {pattern} (e.g., `192.168.1.100`)
   - `fieldF`: Must be valid {format} (e.g., UUID, ISO date)

### Example Request

```json
{
  "field1": "realistic-example-value",
  "nested": {
    "field2": "realistic-value",
    "field3": 42
  }
}
```

> **Note**: For large request bodies, wrap in a `<details><summary>` block:
>
> ```html
> <details>
> <summary>Full Request Body (click to expand)</summary>
>
> ```json
> { ... }
> ```
>
> Source: `path/to/sample-file.json`
> </details>
> ```

## Response

### Success Response (200 OK)

**Content-Type**: `application/json`

**Schema**:
```json
{
  "id": "string (UUID)",
  "status": "string",
  "data": {}
}
```

**Example**:
```json
{
  "id": "5d374524-3117-4ba2-81d6-9a7241427574",
  "status": "CREATED",
  "data": {}
}
```

**Response Fields**:
- `id` (UUID, required): Description of the field and its purpose.
- `status` (string, required): Description.
- `data` (object): Description.

### Error Responses

#### 400 Bad Request

Returned when request validation fails.

**Example**:
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Either viewer.accountId or viewer.standardWebId must be present",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common Validation Errors**:
- Missing required fields
- Invalid format (UUID, date, country code, etc.)
- Failed conditional validation

#### 500 Internal Server Error

Returned when an unexpected server error occurs.

**Example**:
```json
{
  "errorCode": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## CORS Configuration

{Description of CORS support, or omit this section if not applicable.}

## Authentication & Authorization

- {Auth mechanism description (e.g., "No explicit authentication token required")}
- {Access control rules (e.g., geo-based, role-based)}
- {Any filters or middleware that enforce auth}

## Service Dependencies

### Downstream Services (via Kubernetes)

1. **{Service Name}**
   - K8s Service: `{k8s-dns-url}`
   - Purpose: {purpose}
   - Timeout: Connection {conn}ms, Read {read}ms

2. **{Service Name}**
   - K8s Service: `{k8s-dns-url}`
   - Purpose: {purpose}
   - Timeout: Connection {conn}ms, Read {read}ms

## Data Flow

1. Client sends {method} request with {payload description}
2. `{ControllerName}` receives and validates request via `@Valid` annotation
3. `{ServiceName}` orchestrates {business logic description}
4. `{MapperName}` transforms {source format} to {target format}
5. `{ClientName}` calls external {service name} K8s service
6. Response {URLs/data} are constructed with {context}
7. Response returned to client

## Privacy & Compliance

- {PII handling description}
- {GDPR/CCPA compliance via specific service/filter}
- {Country-based access controls}
- {Data minimization rules}

## Monitoring & Tracing

- **Distributed Tracing**: {tracing mechanism (e.g., Zipkin via Spring Cloud Sleuth)}
- **Request/Response Logging**: {logging pattern}
- **Metrics**: {metrics collected (e.g., Micrometer counters/timers)}
- **Trace Integration**: Traces sent to `{trace endpoint}`

## Testing

- **Mock Environment**: {mock URL or mechanism}
- **Wiremock Support**: {test routing if applicable}
- **E2E Testing**: {integration test support}

## Notes

- {Implementation detail 1}
- {Implementation detail 2}
- {Important behavioral note}
```

---

## Heading Format Rules

1. **`## Endpoint Information`** — Use **bold key-value pairs** on separate lines, NOT a table:
   ```
   **HTTP Method**: `POST`
   **Path**: `/v2/resource`
   **Full URL Pattern**: `https://host/v2/resource`
   **Kubernetes Service**: `http://app-svc.namespace.svc.cluster.local/v2/resource`
   ```

2. **`## API Versions Supported`** — Simple bullet list, NOT a table:
   ```
   - `v1`
   - `v2`
   ```

3. **`## Request Body`** — Sub-headings MUST be:
   - `### Schema` (one JSON schema block per endpoint)
   - `### Required Fields` (bullet list)
   - `### Validation Rules` (numbered list with sub-bullets)
   - `### Example Request` (JSON block; use `<details>` for large payloads)

4. **`## Response`** — Error responses are NESTED under this heading:
   - `### Success Response (200 OK)`
   - `### Error Responses`
     - `#### 400 Bad Request`
     - `#### 500 Internal Server Error`

5. **`## Service Dependencies`** — Use a sub-heading:
   - `### Downstream Services (via Kubernetes)` — Numbered list with bold service name, K8s URL, purpose, timeout

6. **`## Authentication & Authorization`**, **`## Testing`**, **`## Notes`** — Always include these. If nothing applies, write "No explicit authentication required" or similar.

## Guidelines

1. **Extract from code**: Read the controller, service, and model classes to fill in every field
2. **Realistic examples**: Use actual sample request files or construct from test files
3. **Collapsible examples**: Use `<details><summary>` for request bodies longer than ~30 lines
4. **Validation rules**: Read `@Valid`, `@NotNull`, custom annotations from model classes
5. **Error codes**: Read exception handlers and error response classes
6. **Timeouts**: Read WebClient or RestTemplate configuration for connection/read timeouts
7. **Cross-reference**: Add related links at the bottom (before metadata footer), but do NOT use a `## Cross-References` heading — just list them inline
