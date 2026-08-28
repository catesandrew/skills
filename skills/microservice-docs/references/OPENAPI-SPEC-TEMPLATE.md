# OpenAPI Specification Template

This template defines the structure for generating an OpenAPI 3.0.3 YAML specification file.

**Output location:** `docs/openapi-docs/{service-name}-openapi.yaml`

## File Structure

```yaml
openapi: 3.0.3
info:
  title: {Service Display Name} API
  description: |
    {One-paragraph service description extracted from README or project overview.}
    
    **Key Capabilities:**
    - {Capability 1 — from controller/service analysis}
    - {Capability 2}
    - ...
    
    **Kubernetes Service**: {K8s service URL from application.yaml or deployment configs}
  version: 1.0.0
  contact:
    name: {Team name from build files or config}

servers:
  - url: http://app-svc.{k8s-namespace}.svc.cluster.local
    description: Internal Kubernetes service endpoint
  # Add production/QA URLs if found in config

tags:
  - name: {Controller API Name}
    description: {From @Api annotation or @Tag description}
  # One tag per controller / logical endpoint group

paths:
  /{path}:
    {method}:
      tags:
        - {Tag name}
      summary: {From @ApiOperation or method-level description}
      description: |
        {Detailed description of what this endpoint does, extracted from
        Swagger annotations or Javadoc.}
      operationId: {controller method name}
      parameters:
        # Path parameters (@PathVariable)
        - name: {param-name}
          in: path
          required: true
          description: {From @ApiParam or @PathVariable annotation}
          schema:
            type: string
        # Query parameters (@RequestParam)
        - name: {param-name}
          in: query
          required: {true/false}
          description: {From @ApiParam or @RequestParam annotation}
          schema:
            type: string
        # Header parameters (@RequestHeader)
        - name: {header-name}
          in: header
          required: false
          description: {From @RequestHeader annotation}
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/{RequestDtoName}'
            examples:
              {exampleName}:
                summary: {Short description}
                value:
                  # Realistic example values from test fixtures or API docs
      responses:
        '200':
          description: {From @ApiResponse message}
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{ResponseDtoName}'
              examples:
                successResponse:
                  summary: Successful response
                  value:
                    # Realistic example
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'
              examples:
                validationError:
                  summary: Validation error
                  value:
                    status: 400
                    message: "Description of validation error"
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'

components:
  schemas:
    # One schema per DTO class
    {DtoClassName}:
      type: object
      required:
        - {field with @NotNull or @NotBlank}
      properties:
        {fieldName}:
          type: {mapped Java type → OpenAPI type}
          description: {From @ApiModelProperty notes}
          example: {realistic value}
        # For enum fields:
        {enumField}:
          type: string
          enum: [{VALUE1}, {VALUE2}, ...]
          description: {enum purpose}
        # For nested objects:
        {nestedField}:
          $ref: '#/components/schemas/{NestedDtoName}'
        # For collections:
        {listField}:
          type: array
          items:
            $ref: '#/components/schemas/{ItemDtoName}'
        {mapField}:
          type: object
          additionalProperties:
            type: {value type}

    ApiError:
      type: object
      properties:
        status:
          type: integer
          description: HTTP status code
        message:
          type: string
          description: Error message
```

## Type Mapping Rules

| Java Type | OpenAPI Type | Format |
|-----------|-------------|--------|
| `String` | `string` | — |
| `int` / `Integer` | `integer` | `int32` |
| `long` / `Long` | `integer` | `int64` |
| `boolean` / `Boolean` | `boolean` | — |
| `double` / `Double` | `number` | `double` |
| `UUID` | `string` | `uuid` |
| `LocalDate` | `string` | `date` |
| `LocalDateTime` / `Instant` | `string` | `date-time` |
| `List<T>` | `array` with `items` | — |
| `Set<T>` | `array` with `items` + `uniqueItems: true` | — |
| `Map<String, T>` | `object` with `additionalProperties` | — |
| Enum | `string` with `enum` values | — |

## Generation Rules

1. **Read controllers first** — extract `@RequestMapping`, `@PostMapping`, `@GetMapping`, etc. for path definitions
2. **Read path constants** — resolve constant references to actual URL strings
3. **Read request/response DTOs** — map every field with its type, validation, and description
4. **Group related endpoints** — debug variants of the same endpoint should share the same schema references
5. **Include all API versions** — V2 and V3 endpoints get separate path entries but may share schemas
6. **Use `$ref`** — never inline complex schemas; always reference `components/schemas`
7. **Realistic examples** — use domain-appropriate values, not generic placeholders
8. **Validation annotations** → OpenAPI constraints: `@NotNull` → `required`, `@NotBlank` → `required` + `minLength: 1`, `@Min`/`@Max` → `minimum`/`maximum`
9. **Deprecated fields** — mark with `deprecated: true`
10. **External library DTOs** — if a request/response field type comes from an external library and the full schema is unknown, define a simplified schema with known fields and add a description noting it is externally defined

## Metadata Footer

The generated YAML file should end with a comment block:

```yaml
# ---
# Last Updated: YYYY-MM-DD
# Total Endpoints: {count}
# Total Schemas: {count}
# Generated via: Static code analysis of controllers, DTOs, and configuration
```
