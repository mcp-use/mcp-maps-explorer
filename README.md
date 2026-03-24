# Maps Explorer — Leaflet maps in your chat

<p>
  <a href="https://github.com/mcp-use/mcp-use">Built with <b>mcp-use</b></a>
  &nbsp;
  <a href="https://github.com/mcp-use/mcp-use">
    <img src="https://img.shields.io/github/stars/mcp-use/mcp-use?style=social" alt="mcp-use stars">
  </a>
</p>

Interactive map MCP App powered by [Leaflet](https://leafletjs.com/). The model places markers, adjusts zoom, and renders live maps inside the conversation with colored pins and popup descriptions.

![Maps Explorer Demo](./repo-assets/demo.gif)

## Try it now

Connect to the hosted instance:

```
https://super-night-ttde2.run.mcp-use.com/mcp
```

Or open the [Inspector](https://inspector.manufact.com/inspector?autoConnect=https%3A%2F%2Fsuper-night-ttde2.run.mcp-use.com%2Fmcp) to test it interactively.

### Setup on ChatGPT

1. Open **Settings** > **Apps and Connectors** > **Advanced Settings** and enable **Developer Mode**
2. Go to **Connectors** > **Create**, name it "Maps Explorer", paste the URL above
3. In a new chat, click **+** > **More** and select the Maps Explorer connector

### Setup on Claude

1. Open **Settings** > **Connectors** > **Add custom connector**
2. Paste the URL above and save
3. The Maps Explorer tools will be available in new conversations

## Features

- **Streaming markers** — pins appear on the map as the model adds them
- **Colored pins** — red, blue, green, orange, purple markers
- **Popup descriptions** — click markers for details
- **Zoom & pan** — fully interactive Leaflet map
- **Fullscreen mode** — expand the map for immersive viewing

## Tools

| Tool | Description |
|------|-------------|
| `show-map` | Display a map centered on a location with markers |
| `get-place-details` | Look up place details by name |
| `add-markers` | Add more markers to an existing map |

## Available Widgets

| Widget | Preview |
|--------|---------|
| `map-view` | <img src="./repo-assets/widget-map-view.png" width="500" /> |

## Local development

```bash
git clone https://github.com/mcp-use/mcp-maps-explorer.git
cd mcp-maps-explorer
npm install
npm run dev
```

## Deploy

```bash
npx mcp-use deploy
```

## Built with

- [mcp-use](https://github.com/mcp-use/mcp-use) — MCP server framework
- [Leaflet](https://leafletjs.com/) — interactive map library (bundled, no CDN required)

## License

MIT
