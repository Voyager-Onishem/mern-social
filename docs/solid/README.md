# SOLID Principles in MERN Social

This documentation provides visual representations and code examples of SOLID principles as implemented in our MERN Social application.

## Getting Started

To complete this documentation with screenshots:

1. **Generate Diagrams**: Follow instructions in [`DIAGRAM_GUIDE.md`](./DIAGRAM_GUIDE.md) to create visual diagrams from the provided PlantUML/Mermaid files
2. **Take Code Screenshots**: Use guidance in [`SCREENSHOT_GUIDE.md`](./SCREENSHOT_GUIDE.md) to capture real code examples
3. **Review Code Examples**: Examine [`CODE_EXAMPLES.md`](./CODE_EXAMPLES.md) for good/bad implementation patterns
4. **Save Images**: Place all generated images in the [`images/`](./images/) directory
5. **Update This README**: Replace the image placeholders below with your generated screenshots

## Table of Contents
- [Single Responsibility Principle (SRP)](#single-responsibility-principle)
- [Open/Closed Principle (OCP)](#openclosed-principle)
- [Liskov Substitution Principle (LSP)](#liskov-substitution-principle)
- [Interface Segregation Principle (ISP)](#interface-segregation-principle)
- [Dependency Inversion Principle (DIP)](#dependency-inversion-principle)

## Single Responsibility Principle

> A class should have only one reason to change.

### Diagram

![Single Responsibility Principle](./images/srp-diagram.png)

### Code Example Screenshots

![SRP in Controllers](./images/srp-controllers.png)

### Implementation in Our Codebase

Our application implements SRP through:

1. Separate controller files for different domain entities:
   - `auth.js` - Manages authentication logic
   - `posts.js` - Handles post-related operations
   - `users.js` - Controls user-specific operations

2. Utility functions with single focused purposes:
   - `sanitizeEmbed.js` - Only responsible for sanitizing embedded content
   - `isGiphyUrl.js` - Only detects if a URL is from Giphy

## Open/Closed Principle

> Software entities should be open for extension, but closed for modification.

### Diagram

![Open/Closed Principle](./images/ocp-diagram.png)

### Code Example Screenshots

![OCP in Practice](./images/ocp-implementation.png)

### Implementation in Our Codebase

Our code demonstrates OCP through:

1. Component composition in React - extending functionality without modifying base components
2. Middleware pipeline in Express - adding new middleware without changing existing ones
3. The video embed system which can be extended to support new providers without modifying the core parsing logic

## Liskov Substitution Principle

> Subtypes must be substitutable for their base types.

### Diagram

![Liskov Substitution Principle](./images/lsp-diagram.png)

### Code Example Screenshots

![LSP in Practice](./images/lsp-implementation.png)

### Implementation in Our Codebase

While JavaScript doesn't enforce types, we follow LSP principles through:

1. Consistent API responses regardless of data source (memory/database/mock)
2. React components that accept the same prop shapes for interchangeability
3. Controller interfaces that maintain consistent behavior across implementations

## Interface Segregation Principle

> A client should not be forced to depend on methods it does not use.

### Diagram

![Interface Segregation Principle](./images/isp-diagram.png)

### Code Example Screenshots

![ISP in Practice](./images/isp-implementation.png)

### Implementation in Our Codebase

We apply ISP by:

1. Creating focused React components that accept only needed props
2. Breaking down larger utilities into smaller, focused modules
3. Using targeted middleware that performs specific functions
4. Designing REST API endpoints that perform specific operations

## Dependency Inversion Principle

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

### Diagram

![Dependency Inversion Principle](./images/dip-diagram.png)

### Code Example Screenshots

![DIP in Practice](./images/dip-implementation.png)

### Implementation in Our Codebase

Our application implements DIP through:

1. Configuration injection rather than direct environment variable access
2. API service modules that abstract external services (like Giphy API)
3. React context providers that decouple state management from components
4. Redux actions/reducers that decouple state mutations from components

## How to Generate These Diagrams

1. Use [PlantUML](https://plantuml.com/) or [Mermaid](https://mermaid-js.github.io/) for creating the principle diagrams
2. Take screenshots of relevant code sections using VS Code
3. Use architecture visualization tools like [Draw.io](https://app.diagrams.net/) for higher-level concepts

## Recommended Screenshot Locations

For effective screenshots demonstrating SOLID principles, consider capturing:

1. **SRP**: The separation of controller files and utility modules
2. **OCP**: The embed system configuration and extension points
3. **LSP**: Component inheritance or interface patterns
4. **ISP**: Focused component props and utility functions
5. **DIP**: Configuration injection and service abstractions
