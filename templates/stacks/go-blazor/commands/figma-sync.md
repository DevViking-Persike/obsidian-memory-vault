Sync design from Figma for a specific page and generate/update Blazor components.

Argument: $ARGUMENTS (required: page name)

Figma File Key: {{FIGMA_KEY}}

Steps:
1. Use Figma MCP `get_design_context` with the correct nodeId and fileKey
2. Analyze the returned code and screenshot
3. Adapt the reference code from React/HTML to Blazor Razor components
4. Match the design language and tokens from the Figma file
5. Create or update the corresponding components in src/ECommerce.Blazor/Components/Pages/
6. Ensure responsive design and accessibility
7. Report what was created/updated with file paths
