# Mermaid Diagram Examples

## Sequence Diagram - API Request Flow

```mermaid
sequenceDiagram
    participant Client as External Client
    participant Ingress as K8s Ingress
    participant Controller as CreateController
    participant Service as CreateService
    participant Mapper as RequestMapper
    participant ExtClient as ExternalClient
    participant ExtSvc as External Service

    Client->>Ingress: POST /api/v1/resource<br/>RequestBody (JSON)
    Ingress->>Controller: Route to service pod

    Note over Controller: @Valid annotation triggers<br/>request validation
    Controller->>Controller: Validate request body

    Controller->>Service: createResource(request)

    Service->>Mapper: Map request to external format
    Mapper->>Mapper: Transform fields:<br/>- input.field1 → output.field1<br/>- input.field2 → output.field2
    Mapper-->>Service: MappedRequest

    Service->>ExtClient: Call via WebClient<br/>POST /external-endpoint
    Note over ExtClient: Connection pool: 1000<br/>Timeout: 500ms conn, 1000ms read

    ExtClient->>ExtSvc: HTTP POST (JSON)
    ExtSvc-->>ExtClient: Response

    ExtClient-->>Service: ExternalResponse

    Service->>Service: Build response with<br/>generated URLs

    Service-->>Controller: CreateResponse
    Controller-->>Client: 200 OK (JSON)

    Note over Client,ExtSvc: Resource created successfully
```

## Sequence Diagram - Error Handling with Alt Blocks

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth as Auth Service
    participant ErrorHandler as GlobalExceptionHandler

    Client->>API: POST /login (credentials)
    API->>Auth: Validate credentials

    alt Valid Credentials
        Auth-->>API: Success + token
        API-->>Client: 200 OK + token
    else Invalid Credentials
        Auth-->>API: Auth failed
        API->>ErrorHandler: AuthenticationException
        ErrorHandler-->>Client: 401 Unauthorized
    else Service Unavailable
        Auth-->>API: Timeout
        API->>ErrorHandler: ServiceUnavailableException
        ErrorHandler-->>Client: 503 Service Unavailable
    end
```

## C4 System Context Diagram (Styled)

```mermaid
graph TB
    Users[End Users<br/>Web/Mobile/TV Clients]
    Service[My Service]

    subgraph External_Systems[External Microservices]
        Svc1[service-a]
        Svc2[service-b]
        Svc3[service-c]
    end

    subgraph Cloud[Cloud Services]
        S3[Object Storage<br/>S3/GCS]
        Cache[Cache<br/>Redis/Valkey]
        DB[(Database<br/>PostgreSQL)]
    end

    Users -->|HTTPS: API| Service
    Service -->|HTTP: Data| Svc1
    Service -->|HTTP: Processing| Svc2
    Service -->|gRPC: Streaming| Svc3
    Service -->|API: Read/Write| S3
    Service -->|TCP: Cache| Cache
    Service -->|JDBC: Query| DB

    style Service fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    style External_Systems fill:#F5F5F5,stroke:#999
    style Cloud fill:#FF9900,stroke:#CC7A00
```

## Component Diagram

```mermaid
graph TB
    subgraph API_Module[API Module - Spring Boot Application]
        Controllers[Controllers<br/>Controller1<br/>Controller2]
        Services[Services<br/>Service1<br/>Service2]
        Mappers[Mappers<br/>Mapper1<br/>Mapper2]
        Clients[HTTP Clients<br/>Client1<br/>Client2]
        Filters[Filters<br/>CorsFilter<br/>AuthFilter]
        Handlers[Exception Handlers<br/>GlobalExceptionHandler]
    end

    Controllers --> Services
    Services --> Mappers
    Services --> Clients
    Controllers --> Filters
    Controllers --> Handlers

    style API_Module fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px
```

## Deployment Diagram (Multi-Region)

```mermaid
graph TB
    Users[End Users] -->|HTTPS| DNS[Route 53 / CloudFlare]

    DNS -->|Routing| Region1[Region 1]
    DNS -->|Routing| Region2[Region 2]

    subgraph Region1[AWS us-east-1]
        LB1[Load Balancer]
        Cluster1[EKS Cluster]
        Store1[S3 Bucket]
    end

    subgraph Region2[AWS us-west-2]
        LB2[Load Balancer]
        Cluster2[EKS Cluster]
    end

    LB1 --> Cluster1
    LB2 --> Cluster2
    Cluster1 -->|S3 API| Store1

    style Region1 fill:#FFE0B2,stroke:#FF9800,stroke-width:2px
    style Region2 fill:#FFE0B2,stroke:#FF9800,stroke-width:2px
```

## ER Diagram

```mermaid
erDiagram
    Request ||--|| Viewer : contains
    Request ||--|| Device : contains
    Request ||--|| Content : contains
    Request ||--o| OptionalField : optional

    Viewer {
        UUID id PK
        string name
        date date-of-birth
        enum gender
        boolean is-active
    }

    Device {
        UUID id PK
        enum type
        string os-name
        string model
    }

    Content {
        UUID id PK
        string title
        integer duration-ms
        enum content-type
    }

    Response ||--|{ ResultItem : contains
    ResultItem {
        UUID item-id PK
        string label
        integer priority
    }
```

## Dependency Graph with Risk Indicators

```mermaid
graph TD
    App[my-service]

    Framework[Spring Boot 3.2<br/>✅ Current]
    LibOld[Library 2.x<br/>⚠️ Behind Latest]
    LibEOL[Framework 1.x<br/>🔴 EOL]
    LibOK[Jackson 2.16<br/>✅ Current]

    App --> Framework
    App --> LibOld
    App --> LibEOL
    App --> LibOK

    style App fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px
    style Framework fill:#C8E6C9,stroke:#66BB6A
    style LibOK fill:#C8E6C9,stroke:#66BB6A
    style LibOld fill:#FFE082,stroke:#FFA000
    style LibEOL fill:#FFCDD2,stroke:#E53935
```

## Data Lineage Flowchart

```mermaid
graph TB
    subgraph Data_IN[Data Sources]
        Input[Client Requests]
        Fields[field-1<br/>field-2<br/>field-3]
    end

    subgraph Transform[Transformation Layer]
        Mapper[RequestMapper]
        Filter[PrivacyFilter]
        Enricher[DataEnricher]
    end

    subgraph Data_OUT[Data Sinks]
        Response[API Response]
        ExtCall[External Service]
        Storage[Database/Cache]
    end

    Input --> Fields
    Fields --> Mapper
    Mapper --> Filter
    Filter --> Enricher
    Enricher --> Response
    Mapper --> ExtCall
    Enricher --> Storage

    style Transform fill:#E3F2FD,stroke:#2196F3,stroke-width:2px
    style Data_IN fill:#C8E6C9,stroke:#66BB6A,stroke-width:2px
    style Data_OUT fill:#FFE0B2,stroke:#FF9800,stroke-width:2px
```

## Infrastructure Topology

```mermaid
graph TB
    subgraph Internet
        Users[End Users]
    end

    subgraph Cloud[AWS Cloud]
        DNS[Route 53]

        subgraph Region[Region: us-east-1]
            LB[ALB]
            subgraph Cluster[EKS Cluster]
                subgraph NS[Namespace]
                    Pods[Application Pods]
                end
            end
            DB[(RDS Database)]
            Cache[(ElastiCache)]
        end
    end

    Users -->|HTTPS| DNS
    DNS --> LB
    LB -->|HTTP/8080| Pods
    Pods --> DB
    Pods --> Cache

    style Region fill:#FFE0B2,stroke:#FF9800,stroke-width:2px
    style Pods fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Created
    Created --> Processing: start()
    Processing --> Completed: success()
    Processing --> Failed: error()
    Failed --> Processing: retry()
    Completed --> [*]
    Failed --> [*]: cancel()
```

## Styling Tips

- Use `fill` for background color, `stroke` for border
- Use `stroke-width` to emphasize important nodes
- Color palette:
  - Primary service: `#4A90E2` (blue)
  - External systems: `#F5F5F5` (light gray)
  - Cloud services: `#FF9900` (orange)
  - Success/current: `#C8E6C9` (green)
  - Warning/behind: `#FFE082` (yellow)
  - Error/EOL: `#FFCDD2` (red)
  - Info/IAM: `#E1F5FE` (light blue)
  - Transform: `#E3F2FD` (blue tint)
  - Data IN: `#C8E6C9` (green tint)
  - Data OUT: `#FFE0B2` (orange tint)
