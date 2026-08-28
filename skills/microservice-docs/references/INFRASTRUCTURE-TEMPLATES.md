# Infrastructure Templates

Create files in `docs/infrastructure/`.

---

## Infrastructure Topology (`infrastructure-topology.md`)

```markdown
# Infrastructure Topology

## Overview
Visual representation of cloud infrastructure and resource relationships.

## Infrastructure Topology Diagram

```mermaid
graph TB
    subgraph Internet
        Users[End Users]
    end

    subgraph Cloud[{Cloud Provider}]
        DNS[DNS Service]

        subgraph Region1[Region: {region-1}]
            LB1[Load Balancer]

            subgraph Cluster1[{Cluster Type}]
                subgraph Namespace1[Namespace: {namespace}]
                    SA1[Service Account]
                    Pods1[Application Pods<br/>{runtime}]
                end
            end

            Store1[Storage]
        end

        subgraph Region2[Region: {region-2}]
            LB2[Load Balancer]

            subgraph Cluster2[{Cluster Type}]
                Pods2[Application Pods]
            end
        end

        subgraph IAM[IAM Resources]
            Role[IAM Role]
            Policy[IAM Policy]
        end
    end

    Users -->|HTTPS| DNS
    DNS -->|Routing| LB1
    DNS -->|Routing| LB2
    LB1 -->|HTTP/{port}| Pods1
    LB2 -->|HTTP/{port}| Pods2
    SA1 -.->|AssumeRole| Role
    Role --> Policy
    Pods1 -->|API| Store1

    style Region1 fill:#FFE0B2,stroke:#FF9800,stroke-width:2px
    style Region2 fill:#FFE0B2,stroke:#FF9800,stroke-width:2px
    style IAM fill:#E1F5FE,stroke:#03A9F4,stroke-width:2px
    style Pods1 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px
```

## Component Relationships

### Access Path: User to Application
```
User
  ↓ HTTPS
DNS ({routing strategy})
  ↓ Route
Load Balancer ({region})
  ↓ HTTP/{port}
Service (ClusterIP / NodePort)
  ↓ Load Balancing
Application Pods
```

### Access Path: Application to Storage
```
Application Pod
  ↓ Service Account
IAM Role (via {auth mechanism})
  ↓ Policy Permissions
Storage ({type})
```

## Security Boundaries

### Network Boundary
- **Public** → DNS → Load Balancer (Public Subnet)
- **LB** → Pods (Private Subnet)
- **Pods** → External Services (via {mechanism})

### Authentication Boundary
- **Service Account** → IAM Role ({trust mechanism})
- **IAM Role** → Policy (Least Privilege)

### Encryption Boundaries
- **Client ↔ LB**: TLS 1.2+
- **LB ↔ Pods**: {HTTP/mTLS}
- **Pods ↔ Pods**: {mTLS/plaintext}
- **Pods ↔ Storage**: {HTTPS/TLS}
- **Data at Rest**: {encryption method}

## Failure Impact Analysis

| Component | Impact | Mitigation |
|-----------|--------|------------|
| DNS | Service unreachable | Multi-region health checks |
| Load Balancer | Region unavailable | Failover to other region |
| Cluster | Region down | Multi-region deployment |
| IAM | Cannot access resources | Service continues with cache |

## Deployment Sequence

### Initial
1. Infrastructure provisioning ({Terraform/CloudFormation/Pulumi})
2. Cluster and namespace creation
3. Service account and IAM binding
4. Application deployment
5. Service and ingress creation
6. DNS configuration

### Updates
1. New container image built
2. Rolling update (gradual pod replacement)
3. Health check verification
4. Traffic shift

## Observability Flow

### Metrics
```
Application Metrics → {Exporter} → {Backend} → Dashboards
```

### Logs
```
Application Logs → {Collector} → {Storage} → {Query Engine}
```

### Tracing
```
Application Traces → {Exporter} → {Backend} → {UI}
```

## Cross-References
- [Environment Configs](./environment-configs.md)
- [IAM Policies](./iam-policies.md)
- [Networking](./networking.md)
- [Deployment Diagram](../architecture/deployment-diagram.md)

---

**Last Updated:** YYYY-MM-DD
**Regions**: {list}
**Deployment Model**: {active-active / active-passive / single-region}
```

---

## Environment Configs (`environment-configs.md`)

```markdown
# Environment Configurations

## Overview
Environment-specific configuration for {service-name}.

## Environments

| Environment | Purpose | Region(s) | Profile(s) | Replicas |
|-------------|---------|-----------|------------|----------|
| prod | Production | {regions} | {profiles} | {count} |
| qa | Testing | {regions} | {profiles} | {count} |
| dev | Development | {regions} | {profiles} | {count} |

## Configuration by Environment

### Production
| Property | Value | Source |
|----------|-------|--------|
| `{property}` | `{value}` | `{config file}` |

### QA
| Property | Value | Source |
|----------|-------|--------|
| `{property}` | `{value}` | `{config file}` |

## Required Environment Variables

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `{VAR_NAME}` | Yes | - | {description} | `{example}` |

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `{flag.name}` | {value} | {description} |

---

**Last Updated:** YYYY-MM-DD
**Total Environments**: {count}
```

---

## Networking (`networking.md`)

```markdown
# Networking

## Overview
Network configuration, service discovery, and communication patterns.

## Service Discovery
- **Mechanism**: {K8s DNS / Consul / Eureka / direct URL}
- **Pattern**: `{service-name}.{namespace}.svc.cluster.local`

## External Service Endpoints

| Service | Internal URL | Port | Protocol | Timeout |
|---------|-------------|------|----------|---------|
| {name} | {url} | {port} | {HTTP/gRPC} | {timeout}ms |

## Load Balancing
- **External**: {ALB/NLB/Nginx/HAProxy}
- **Internal**: {K8s Service / Client-side}

## CORS Configuration *(if applicable)*
- **Allowed Origins**: {origins}
- **Allowed Methods**: {methods}
- **Allowed Headers**: {headers}

## Rate Limiting *(if applicable)*
- **Mechanism**: {API Gateway / middleware}
- **Limits**: {requests per second/minute}

## Circuit Breaker *(if applicable)*
- **Library**: {Resilience4j / Hystrix / custom}
- **Configuration**: {thresholds}

---

**Last Updated:** YYYY-MM-DD
**Service Discovery**: {mechanism}
```

---

## IAM Policies (`iam-policies.md`)

```markdown
# IAM Policies

## Overview
IAM roles, policies, and permissions for {service-name}.

## Application IAM Role

### Role Name
`{role-name-pattern}`

### Trust Relationship
**Trusted Entity**: {K8s Service Account / EC2 Instance / Lambda}
**Namespace**: `{namespace}`
**Service Account**: `{sa-name}`

### Managed Via
{Terraform module / CloudFormation / Manual}

## Policy Statements

### Statement {N}: {Descriptive Name}

**Effect**: Allow
**Actions**: `{action:pattern}`

**Resources**:
```
{resource ARN pattern}
```

**Purpose**: {why this permission is needed}

**Security Analysis**:
- ✅ {strength}
- ⚠️ {weakness / recommendation}

**Recommended Restriction** *(if overly permissive)*:
```json
{
  "actions": ["{specific-action-1}", "{specific-action-2}"]
}
```

## Security Analysis

### Strengths
1. {strength}

### Weaknesses & Recommendations
1. **{Issue}**: {current} → {recommended}

## Policy Document (JSON)

### Current Policy
<details>
<summary>Click to expand</summary>

```json
{
  "Version": "2012-10-17",
  "Statement": []
}
```
</details>

### Recommended Improved Policy
<details>
<summary>Click to expand</summary>

```json
{
  "Version": "2012-10-17",
  "Statement": []
}
```
</details>

## Compliance Considerations
- {SOC 2 / PCI DSS / HIPAA / GDPR notes}

## Auditing & Monitoring
- {CloudTrail / audit log configuration}
- **Recommended Alerts**: {list}

---

**Last Updated:** YYYY-MM-DD
**IAM Module Version**: {version}
**Compliance**: {standards}
```

## Guidelines

1. **Read Terraform/CloudFormation**: Extract IAM roles, policies, resources from IaC files
2. **Read K8s manifests**: Extract service accounts, RBAC, network policies
3. **Read application config**: Extract service URLs, timeouts, pool sizes
4. **Security analysis**: Flag overly permissive policies and recommend least-privilege alternatives
5. **Show access paths**: Visualize how requests flow from user to application to resources
