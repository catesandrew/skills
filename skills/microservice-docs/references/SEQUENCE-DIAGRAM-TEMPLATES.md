# Sequence Diagram Templates

Create one file per major flow in `docs/sequence-diagrams/`.

## File Naming Convention

`{NN}-{flow-name}.md`

Use numeric prefix for ordering: `01-create-flow.md`, `02-get-flow.md`, `03-update-flow.md`.

For supplementary flows: `authentication-flow.md`, `error-handling-flow.md`.

---

## Template

```markdown
# {Flow Name}

```mermaid
sequenceDiagram
    participant Client as External Client
    participant Ingress as {Ingress/Gateway}
    participant Controller as {ControllerName}
    participant Service as {ServiceName}
    participant Mapper as {MapperName}
    participant ExtClient as {ExternalClientName}
    participant ExtSvc as {External Service Name}

    Client->>Ingress: {HTTP_METHOD} {path}<br/>{RequestType} (JSON)
    Ingress->>Controller: Route to {service} pod

    Note over Controller: Validation via {mechanism}
    Controller->>Controller: Validate request<br/>({fields validated})

    Controller->>Service: {methodName}(request, params)

    Service->>Mapper: Map request to {target} format
    Mapper->>Mapper: Transform fields:<br/>- input.field1 → output.field1<br/>- input.field2 → output.field2
    Mapper-->>Service: {MappedRequestType}

    Service->>ExtClient: Call via {HTTP client}<br/>{HTTP_METHOD} {path}
    Note over ExtClient: Connection pool: {size}<br/>Timeout: {conn}ms conn, {read}ms read

    ExtClient->>ExtSvc: HTTP {METHOD} (JSON)
    ExtSvc->>ExtSvc: {processing description}
    ExtSvc-->>ExtClient: {ResponseType}

    ExtClient-->>Service: {response description}

    Service->>Service: {post-processing steps}

    Service-->>Controller: {FinalResponseType}

    Note over Controller: {observability note}
    Controller-->>Ingress: {status code}<br/>{ResponseType} (JSON)
    Ingress-->>Client: Response

    Note over Client,ExtSvc: {summary of what was accomplished}
```

## Flow Description

### 1. Request Reception
- Client sends {method} request with {payload description}
- Request routed through {ingress/gateway} to service

### 2. Request Validation
- {Validation mechanism} triggers validation
- Validators check:
  - {validation rule 1}
  - {validation rule 2}

### 3. Business Logic
- {Service} orchestrates the operation
- Steps:
  1. {step 1}
  2. {step 2}

### 4. External Service Call
- {Client} calls {external service} via {protocol}
- Configuration: {connection pool, timeouts}

### 5. Response Construction
- {How response is built}
- {Any enrichment or URL construction}

### 6. Response Delivery
- {Final response format and delivery}

## Error Handling

| Error | HTTP Code | Cause | Handling |
|-------|-----------|-------|----------|
| Validation Error | 400 | {cause} | {how handled} |
| Service Unavailable | 503 | {cause} | {how handled} |
| Internal Error | 500 | {cause} | {how handled} |

## Performance Characteristics

- **Typical Latency**: {range}ms
- **Connection Pooling**: {pool size, reuse strategy}
- **Timeout Protection**: {total timeout}ms
- **Async Processing**: {sync/async details}

## Monitoring & Observability

- **Distributed Tracing**: {tracing mechanism and sampler}
- **Metrics**: {what metrics are collected}
- **Log Correlation**: {request ID tracking}
```

---

## Error Handling Flow Template

For documenting the global error handling flow:

```markdown
# Error Handling Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant ErrorHandler as GlobalExceptionHandler

    Client->>Controller: Request

    alt Validation Error
        Controller->>Controller: @Valid fails
        Controller->>ErrorHandler: MethodArgumentNotValidException
        ErrorHandler-->>Client: 400 Bad Request<br/>{error body}
    else Business Logic Error
        Controller->>Service: process()
        Service->>Service: Business rule violation
        Service->>ErrorHandler: CustomException
        ErrorHandler-->>Client: 400/422<br/>{error body}
    else External Service Failure
        Controller->>Service: process()
        Service->>Service: External call timeout
        Service->>ErrorHandler: ServiceUnavailableException
        ErrorHandler-->>Client: 503 Service Unavailable
    else Unexpected Error
        Controller->>Service: process()
        Service->>ErrorHandler: RuntimeException
        ErrorHandler-->>Client: 500 Internal Server Error
    end
```

## Error Categories

### Validation Errors (4xx)
- {error type}: {description}

### Business Errors (4xx)
- {error type}: {description}

### Infrastructure Errors (5xx)
- {error type}: {description}

## Error Response Format

```json
{
  "errorCode": "string",
  "message": "string",
  "timestamp": "ISO-8601"
}
```
```

---

## Authentication Flow Template *(if applicable)*

```markdown
# Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant App as Application

    Client->>Gateway: Request + {auth mechanism}
    Gateway->>Auth: Validate {token/key/cert}

    alt Valid
        Auth-->>Gateway: Authenticated
        Gateway->>App: Forward request + identity
        App-->>Client: 200 Response
    else Invalid
        Auth-->>Gateway: Rejected
        Gateway-->>Client: 401 Unauthorized
    end
```
```

## Guidelines

1. **Read the actual code**: Trace from controller → service → mapper → external client for each flow
2. **Name participants after real classes**: Use actual class names from the codebase
3. **Show real field transformations**: In the Mapper participant, list actual field mappings
4. **Include configuration details**: Show timeouts, pool sizes, sampler names from config files
5. **Document alt paths**: Use `alt`/`else` blocks for error scenarios that exist in code
6. **One diagram per flow**: Each major API operation or background process gets its own file
7. **Add performance data**: Include latency expectations and timeout configurations
8. **Cross-reference**: Link to the API contract and data model docs for this flow
