import { MCPServer } from "mcp-use";
import { z } from "zod";

const markerSchema = z.object({
  lat: z.number().describe("Latitude"),
  lng: z.number().describe("Longitude"),
  title: z.string().describe("Marker title"),
  description: z.string().optional().describe("Marker description"),
  color: z.enum(["red", "blue", "green", "orange", "purple"]).optional().describe("Marker color"),
});
const mapSchema = z.object({
  title: z.string().optional().describe("Map title"),
  center: z.object({ lat: z.number(), lng: z.number() }).describe("Map center coordinates"),
  zoom: z.number().min(1).max(18).describe("Zoom level (1=world, 18=building)"),
  markers: z.array(markerSchema).describe("Map markers"),
});
type MapState = z.infer<typeof mapSchema>;

const server = new MCPServer({
  name: "maps-explorer",
  title: "Maps Explorer",
  version: "2.0.0",
  description: "Interactive maps — Leaflet in your chat",
  instructions: "Use show-map to display a map, then add-markers to extend the current map.",
  favicon: "favicon.ico",
  icons: [{ src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] }],
});

let lastMapState: MapState = { center: { lat: 0, lng: 0 }, zoom: 5, markers: [] };

const placeDatabase: Record<string, { population: string; timezone: string; country: string; funFacts: string[]; coordinates: { lat: number; lng: number } }> = {
  paris: { population: "2.1 million (city), 12.2 million (metro)", timezone: "CET (UTC+1)", country: "France", funFacts: ["The Eiffel Tower was originally meant to be temporary", "Paris has only one stop sign in the entire city", "There are 6,100 streets in Paris"], coordinates: { lat: 48.8566, lng: 2.3522 } },
  tokyo: { population: "13.9 million (city), 37.4 million (metro)", timezone: "JST (UTC+9)", country: "Japan", funFacts: ["Tokyo was originally called Edo", "Has more Michelin-starred restaurants than any other city", "The Shibuya crossing sees up to 3,000 people per signal change"], coordinates: { lat: 35.6762, lng: 139.6503 } },
  "new york": { population: "8.3 million (city), 20.1 million (metro)", timezone: "EST (UTC-5)", country: "United States", funFacts: ["Over 800 languages are spoken in NYC", "Central Park is larger than Monaco", "The subway system has 472 stations"], coordinates: { lat: 40.7128, lng: -74.006 } },
  london: { population: "8.8 million (city), 14.3 million (metro)", timezone: "GMT (UTC+0)", country: "United Kingdom", funFacts: ["Big Ben is actually the name of the bell, not the tower", "London has over 170 museums", "The Tube is the oldest underground railway"], coordinates: { lat: 51.5074, lng: -0.1278 } },
  sydney: { population: "5.3 million", timezone: "AEST (UTC+10)", country: "Australia", funFacts: ["Sydney Opera House has over 1 million roof tiles", "Bondi Beach is one of the most visited beaches", "The Harbour Bridge is the world's largest steel arch bridge"], coordinates: { lat: -33.8688, lng: 151.2093 } },
  cairo: { population: "9.5 million (city), 21.3 million (metro)", timezone: "EET (UTC+2)", country: "Egypt", funFacts: ["Cairo is the largest city in Africa", "The Great Pyramid of Giza is the only ancient wonder still standing", "Cairo is known as The City of a Thousand Minarets"], coordinates: { lat: 30.0444, lng: 31.2357 } },
  "rio de janeiro": { population: "6.7 million (city), 13.5 million (metro)", timezone: "BRT (UTC-3)", country: "Brazil", funFacts: ["Christ the Redeemer is one of the New Seven Wonders", "Carnival attracts 2 million people per day", "Sugarloaf Mountain rises 396m above the harbor"], coordinates: { lat: -22.9068, lng: -43.1729 } },
  mumbai: { population: "12.5 million (city), 20.7 million (metro)", timezone: "IST (UTC+5:30)", country: "India", funFacts: ["Mumbai's local train carries 7.5 million commuters daily", "Bollywood produces over 1,500 films per year", "The city was built on seven islands"], coordinates: { lat: 19.076, lng: 72.8777 } },
};

export const showMap = server.tool(
  {
    name: "show-map",
    description: "Show an interactive map with colored markers, titles, and descriptions.",
    inputSchema: mapSchema,
    outputSchema: mapSchema,
    view: { name: "map-view", description: "Interactive Leaflet map with markers and place details", prefersBorder: true, csp: { resourceDomains: ["https://tile.openstreetmap.org"], connectDomains: ["https://tile.openstreetmap.org"], redirectDomains: ["https://www.google.com"] } },
  },
  async (map) => {
    lastMapState = map;
    return { content: [{ type: "text", text: `Map centered at ${map.center.lat.toFixed(4)}, ${map.center.lng.toFixed(4)} (zoom ${map.zoom}) with ${map.markers.length} marker${map.markers.length === 1 ? "" : "s"}${map.title ? `: ${map.title}` : ""}` }], structuredContent: map };
  },
);

const placeDetailsSchema = z.object({ name: z.string(), population: z.string(), timezone: z.string(), country: z.string(), funFacts: z.array(z.string()), coordinates: z.object({ lat: z.number(), lng: z.number() }) });
export const getPlaceDetails = server.tool(
  { name: "get-place-details", description: "Get population, timezone, country, and fun facts about a named place.", inputSchema: z.object({ name: z.string().describe("Place name to look up") }), outputSchema: placeDetailsSchema },
  async ({ name }) => {
    const place = placeDatabase[name.toLowerCase().trim()];
    const data = place ? { name, ...place } : { name, population: "Unknown", timezone: "Unknown", country: "Unknown", funFacts: [`No detailed data available for \"${name}\"`], coordinates: lastMapState.center };
    return { content: [{ type: "text", text: `${data.name}: ${data.country}; population ${data.population}; timezone ${data.timezone}.` }], structuredContent: data };
  },
);

export const addMarkers = server.tool(
  {
    name: "add-markers",
    description: "Add markers to the current map and render the updated map.",
    inputSchema: z.object({ markers: z.array(markerSchema).describe("New markers to add to the map") }),
    outputSchema: mapSchema,
    view: { name: "map-markers", description: "Updated interactive map with markers and place details", prefersBorder: true, csp: { resourceDomains: ["https://tile.openstreetmap.org"], connectDomains: ["https://tile.openstreetmap.org"], redirectDomains: ["https://www.google.com"] } },
  },
  async ({ markers }) => {
    lastMapState = { ...lastMapState, markers: [...lastMapState.markers, ...markers] };
    return { content: [{ type: "text", text: `Added ${markers.length} marker${markers.length === 1 ? "" : "s"}. Map now has ${lastMapState.markers.length} total markers.` }], structuredContent: lastMapState };
  },
);

export default server;
