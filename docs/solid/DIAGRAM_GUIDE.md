# Generating SOLID Principle Diagrams

This guide explains how to convert the PlantUML and Mermaid diagram specifications into visual images for your documentation.

## Option 1: Using VS Code Extensions

### For PlantUML

1. Install the "PlantUML" extension for VS Code
   - Extension ID: `jebbs.plantuml`
   - Search for "PlantUML" in the extensions marketplace

2. Open any `.puml` file in the `diagrams` directory

3. Generate the diagram:
   - Right-click in the editor and select "PlantUML: Preview Current Diagram"
   - OR use the keyboard shortcut (Alt+D on Windows/Linux, Option+D on Mac)

4. Export as PNG:
   - In the preview window, right-click and select "Export Diagram"
   - Choose PNG format and save to the `images` directory

### For Mermaid

1. Install the "Markdown Preview Mermaid Support" extension
   - Extension ID: `bierner.markdown-mermaid`
   - Search for "Mermaid" in the extensions marketplace

2. Open any `.md` file containing Mermaid diagrams

3. Preview the diagram:
   - Right-click in the editor and select "Open Preview"
   - OR use the keyboard shortcut (Ctrl+Shift+V on Windows/Linux, Cmd+Shift+V on Mac)

4. Take a screenshot of the rendered diagram:
   - Windows: Use Snipping Tool or Win+Shift+S
   - Mac: Use Cmd+Shift+4
   - Save to the `images` directory

## Option 2: Using Online Tools

### For PlantUML

1. Go to the [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)

2. Copy the content of any `.puml` file

3. Paste it into the online editor

4. The diagram will be automatically rendered

5. Save the image:
   - Right-click on the image and select "Save Image As..."
   - Save to the `images` directory

### For Mermaid

1. Go to the [Mermaid Live Editor](https://mermaid-js.github.io/mermaid-live-editor/)

2. Copy the content between the \`\`\`mermaid and \`\`\` tags from any `.md` file

3. Paste it into the editor

4. The diagram will be automatically rendered

5. Click on "Download SVG" or take a screenshot
   - Save to the `images` directory

## Option 3: Command Line Tools

### For PlantUML

1. Install the PlantUML command line tool:
   - Download from [PlantUML website](https://plantuml.com/download)
   - Or use package managers: `brew install plantuml` (Mac), `apt-get install plantuml` (Ubuntu)

2. Generate PNG images:
   ```bash
   plantuml -o ../images diagrams/srp-diagram.puml
   plantuml -o ../images diagrams/ocp-diagram.puml
   plantuml -o ../images diagrams/lsp-diagram.puml
   plantuml -o ../images diagrams/isp-diagram.puml
   plantuml -o ../images diagrams/dip-diagram.puml
   ```

### For Mermaid

1. Install the Mermaid CLI:
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

2. Generate PNG images:
   ```bash
   mmdc -i diagrams/srp-mermaid.md -o images/srp-mermaid.png
   mmdc -i diagrams/ocp-mermaid.md -o images/ocp-mermaid.png
   ```

## Combining Diagrams with Code Screenshots

For each SOLID principle:

1. Generate the corresponding diagram image

2. Take screenshots of relevant code examples from the `CODE_EXAMPLES.md` file

3. Take screenshots of actual code from your codebase as suggested in the `SCREENSHOT_GUIDE.md`

4. Arrange these images in the README.md file to demonstrate each principle:
   - Start with the diagram to explain the principle
   - Show the code examples that demonstrate good and bad practices
   - Include screenshots of your actual implementation

## Example Organization in README

```markdown
## Single Responsibility Principle

### Diagram
![SRP Diagram](./images/srp-diagram.png)

### Good vs Bad Examples
![SRP Examples](./images/srp-examples.png)

### Implementation in Our Codebase
![SRP Implementation](./images/srp-implementation.png)
```

## Tips for Professional-Looking Diagrams

1. Use consistent colors across all diagrams:
   - Green for good practices
   - Red for anti-patterns
   - Blue for interfaces/abstractions
   - Yellow for concrete implementations

2. Add clear titles and notes to explain key points

3. Use readable fonts and appropriate spacing

4. For code screenshots, use a consistent color theme (e.g., VS Code's dark theme)

5. Consider adding highlights (arrows, boxes) to draw attention to important parts

6. Include file names in screenshots for context