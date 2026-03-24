import { MCPServer, object, text, widget } from "mcp-use/server";
import { z } from "zod";

const markerSchema = z.object({
  lat: z.number().describe("Latitude"),
  lng: z.number().describe("Longitude"),
  title: z.string().describe("Marker title"),
  description: z.string().optional().describe("Marker description"),
  color: z.enum(["red", "blue", "green", "orange", "purple"]).optional().describe("Marker color"),
});

const server = new MCPServer({
  name: "maps-explorer",
  title: "Maps Explorer",
  version: "1.0.0",
  description: "Interactive maps — Leaflet in your chat",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  icons: [
    { src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] },
  ],
});

let lastMapState: {
  center: { lat: number; lng: number };
  zoom: number;
  markers: z.infer<typeof markerSchema>[];
} = {
  center: { lat: 0, lng: 0 },
  zoom: 5,
  markers: [],
};

const placeDatabase: Record<
  string,
  {
    population: string;
    timezone: string;
    country: string;
    funFacts: string[];
    coordinates: { lat: number; lng: number };
  }
> = {
  paris: {
    population: "2.1 million (city), 12.2 million (metro)",
    timezone: "CET (UTC+1)",
    country: "France",
    funFacts: [
      "The Eiffel Tower was originally meant to be temporary",
      "Paris has only one stop sign in the entire city",
      "There are 6,100 streets in Paris",
    ],
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  tokyo: {
    population: "13.9 million (city), 37.4 million (metro)",
    timezone: "JST (UTC+9)",
    country: "Japan",
    funFacts: [
      "Tokyo was originally called Edo",
      "Has more Michelin-starred restaurants than any other city",
      "The Shibuya crossing sees up to 3,000 people per signal change",
    ],
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  "new york": {
    population: "8.3 million (city), 20.1 million (metro)",
    timezone: "EST (UTC-5)",
    country: "United States",
    funFacts: [
      "Over 800 languages are spoken in NYC",
      "Central Park is larger than Monaco",
      "The subway system has 472 stations",
    ],
    coordinates: { lat: 40.7128, lng: -74.006 },
  },
  london: {
    population: "8.8 million (city), 14.3 million (metro)",
    timezone: "GMT (UTC+0)",
    country: "United Kingdom",
    funFacts: [
      "Big Ben is actually the name of the bell, not the tower",
      "London has over 170 museums",
      "The Tube is the oldest underground railway in the world",
    ],
    coordinates: { lat: 51.5074, lng: -0.1278 },
  },
  sydney: {
    population: "5.3 million",
    timezone: "AEST (UTC+10)",
    country: "Australia",
    funFacts: [
      "Sydney Opera House has over 1 million roof tiles",
      "Bondi Beach is one of the most visited beaches in the world",
      "The Harbour Bridge is the world's largest steel arch bridge",
    ],
    coordinates: { lat: -33.8688, lng: 151.2093 },
  },
  cairo: {
    population: "9.5 million (city), 21.3 million (metro)",
    timezone: "EET (UTC+2)",
    country: "Egypt",
    funFacts: [
      "Cairo is the largest city in Africa",
      "The Great Pyramid of Giza is the only ancient wonder still standing",
      "Cairo is known as 'The City of a Thousand Minarets'",
    ],
    coordinates: { lat: 30.0444, lng: 31.2357 },
  },
  "rio de janeiro": {
    population: "6.7 million (city), 13.5 million (metro)",
    timezone: "BRT (UTC-3)",
    country: "Brazil",
    funFacts: [
      "Christ the Redeemer is one of the New Seven Wonders of the World",
      "Carnival attracts 2 million people per day",
      "Sugarloaf Mountain rises 396m above the harbor",
    ],
    coordinates: { lat: -22.9068, lng: -43.1729 },
  },
  mumbai: {
    population: "12.5 million (city), 20.7 million (metro)",
    timezone: "IST (UTC+5:30)",
    country: "India",
    funFacts: [
      "Mumbai's local train system carries 7.5 million commuters daily",
      "Bollywood produces over 1,500 films per year",
      "The city was built on seven islands",
    ],
    coordinates: { lat: 19.076, lng: 72.8777 },
  },
};

server.tool(
  {
    name: "show-map",
    description:
      "Show an interactive map with markers. Supports colored markers with titles and descriptions. " +
      "Use this to display locations, routes, points of interest, or any geographic data.",
    schema: z.object({
      center: z
        .object({ lat: z.number(), lng: z.number() })
        .describe("Map center coordinates"),
      zoom: z
        .number()
        .min(1)
        .max(18)
        .default(5)
        .describe("Zoom level (1=world, 18=building)"),
      markers: z
        .array(markerSchema)
        .describe("Array of map markers to display"),
      title: z.string().optional().describe("Optional map title"),
    }),
    widget: {
      name: "map-view",
      invoking: "Loading map...",
      invoked: "Map ready",
    },
  },
  async ({ center, zoom, markers, title }) => {
    lastMapState = { center, zoom, markers };

    return widget({
      props: { center, zoom, markers, title },
      output: text(
        `Map centered at ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)} ` +
          `(zoom ${zoom}) with ${markers.length} marker${markers.length !== 1 ? "s" : ""}` +
          (title ? `: ${title}` : "")
      ),
    });
  }
);

server.tool(
  {
    name: "get-place-details",
    description:
      "Get details about a named place — population, timezone, country, and fun facts.",
    schema: z.object({
      name: z.string().describe("Place name to look up"),
    }),
    outputSchema: z.object({
      name: z.string(),
      population: z.string(),
      timezone: z.string(),
      country: z.string(),
      funFacts: z.array(z.string()),
      coordinates: z.object({ lat: z.number(), lng: z.number() }),
    }),
  },
  async ({ name }) => {
    const key = name.toLowerCase().trim();
    const place = placeDatabase[key];

    if (place) {
      return object({
        name,
        population: place.population,
        timezone: place.timezone,
        country: place.country,
        funFacts: place.funFacts,
        coordinates: place.coordinates,
      });
    }

    return object({
      name,
      population: "Unknown",
      timezone: "Unknown",
      country: "Unknown",
      funFacts: [`No detailed data available for "${name}"`],
      coordinates: lastMapState.center,
    });
  }
);

server.tool(
  {
    name: "add-markers",
    description:
      "Add new markers to the current map. Merges with existing markers from the last show-map call.",
    schema: z.object({
      markers: z.array(markerSchema).describe("New markers to add to the map"),
    }),
    widget: {
      name: "map-view",
      invoking: "Adding markers...",
      invoked: "Markers added",
    },
  },
  async ({ markers: newMarkers }) => {
    lastMapState.markers = [...lastMapState.markers, ...newMarkers];

    return widget({
      props: {
        center: lastMapState.center,
        zoom: lastMapState.zoom,
        markers: lastMapState.markers,
      },
      output: text(
        `Added ${newMarkers.length} marker${newMarkers.length !== 1 ? "s" : ""}. ` +
          `Map now has ${lastMapState.markers.length} total markers.`
      ),
    });
  }
);

server.listen().then(() => console.log("Maps Explorer running"));
