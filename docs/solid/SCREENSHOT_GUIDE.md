# Screenshot Guide for SOLID Principles

This guide provides specific locations in our codebase to take screenshots that demonstrate each SOLID principle in action.

## Single Responsibility Principle (SRP)

### Screenshot 1: Controller Separation

Show the directory structure of `server/controllers/` to demonstrate how each controller has a single responsibility:
- `auth.js` - Authentication logic
- `posts.js` - Post management
- `users.js` - User operations

### Screenshot 2: Utility Functions

Show the implementation of these focused utility functions:
1. `client/src/utils/sanitizeEmbed.js` - Shows a utility with a single responsibility
2. `client/src/utils/isGiphyUrl.js` - Shows another focused utility

## Open/Closed Principle (OCP)

### Screenshot 1: Video Embed System

Show the implementation of the video URL parsing in `client/src/utils/video.js` which could be extended for new providers.

### Screenshot 2: Express Middleware

Show how the Express middleware stack in `server/index.js` can be extended with new middleware without modifying existing code.

## Liskov Substitution Principle (LSP)

### Screenshot 1: Component Props

Show a React component that expects certain props and could work with any implementation that provides those props.

### Screenshot 2: API Response Structure

Show consistent API response structure across different controllers, demonstrating that clients can rely on the same interface.

## Interface Segregation Principle (ISP)

### Screenshot 1: Focused Component Props

Show a React component that accepts only the props it needs rather than large objects.

### Screenshot 2: API Endpoints

Show API endpoints that perform specific operations rather than accepting large payload objects with many fields.

## Dependency Inversion Principle (DIP)

### Screenshot 1: Giphy API Abstraction

Show the `client/src/api/giphyApi.js` file which abstracts the Giphy API, allowing components to depend on the abstraction rather than direct API calls.

### Screenshot 2: Configuration Injection

Show how configuration values are injected rather than directly accessed, allowing for easier testing and flexibility.

## How to Take Effective Screenshots

1. Use VS Code's built-in screenshot capability or a tool like [Snipping Tool](Windows) or [Screenshot](Mac)
2. Ensure good contrast and readable font size
3. Include enough context (file name, surrounding code) to understand what's being shown
4. Consider using VS Code's "Bracket Pair Colorization" for clearer code structure
5. Highlight key lines that demonstrate the principle using comments or VS Code's selection highlighting

## Screenshot Organization

Save your screenshots in the `docs/solid/images/` directory with clear naming:
- `srp-controllers.png`
- `srp-utilities.png`
- `ocp-video-embed.png`
- etc.

Then update the README.md to reference these images.

## Alternative Visualization: Mermaid/PlantUML Diagrams

If you prefer to generate diagrams from code rather than screenshots:

1. Use the provided `.puml` and `.md` files in the `diagrams` directory
2. Render them using:
   - VS Code extensions like "PlantUML" and "Mermaid Preview"
   - Online tools like [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/) and [Mermaid Live Editor](https://mermaid-js.github.io/mermaid-live-editor/)
3. Save the rendered diagrams as images in the `images` directory