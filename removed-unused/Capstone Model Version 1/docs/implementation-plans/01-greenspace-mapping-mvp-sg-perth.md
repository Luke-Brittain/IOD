# 01 Greenspace & Inequity Mapping Platform (MVP) - Singapore & Perth Implementation Plan

## Project Context

**Technical Stack**
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript 5.x, Tailwind CSS + CSS Modules
- **Mapping**: Mapbox GL JS (primary), Leaflet (fallback)
- **Backend**: Supabase (PostgreSQL + PostGIS), optional DuckDB for analytics
- **Object Storage**: S3 or Cloudinary for raster tiles, exported maps
- **LLM Integration**: OpenAI GPT-4 (grounded narrative generation)
- **Authentication**: Supabase Auth (optional for MVP; public read-only by default)
- **Infrastructure**: Vercel (frontend), Fly.io/Render (database + optional processing)
- **CI/CD**: GitHub Actions for testing and deployment

**Prototype Scope**: Singapore + Perth, Australia (two cities, 4 administrative geographies per city)

---

## User Stories

**Core Stories Implemented** (Stories 05-14):
- **05**: Select city and geography from preconfigured list
- **06**: View city-wide greenspace with classified raster overlay + choropleth by region
- **07**: Drill-down to regional statistics (class proportions, greenspace index, percentile)
- **08**: Toggle layers (raster, boundaries, optional context layers)
- **09**: Browse socioeconomic data catalogue with filtering
- **10**: View indicator values for selected region + percentile ranks
- **11**: Side-by-side region comparison (pinned region A vs selected region B)
- **12**: Natural language interpretation of regional patterns (LLM-powered)
- **13**: Export map (PNG), data (CSV), and narrative report
- **14**: Explore correlation/bivariate analysis (greenspace vs indicator relationship)

---

## Pre-conditions

### System State
- PostGIS database populated with Singapore + Perth boundaries (SA2/ward polygons)
- Raster tiles pre-generated (COG format) and hosted on S3 or CDN
- Socioeconomic indicator tables loaded with census vintage 2021/2020
- Correlation matrices precomputed and cached

### User State
- Public MVP: no authentication required (read-only access)
- All users see same cities + data; future: logged-in users for saved preferences

### Data Requirements
- City boundary GeoJSON (WGS84) for Singapore + Perth
- Administrative regions GeoJSON (SA2 for Singapore Subzones; SA2 for Perth)
- Greenspace classification raster (4 classes: water, urban, green_residential, parkland)
- Census tables: population, area, demographic indicators
- Indicator catalogue with 8–12 socioeconomic indicators per city

---

## Business Requirements

1. **Discoverability & Accessibility**
   - Success metric: Users can navigate to any city within 3 clicks
   - Users understand greenspace disparities at a glance (visual legend + percentile rank)

2. **Data Transparency**
   - Success metric: All data sources, vintage dates, and limitations are visible
   - Users can download raw data (CSV) for further analysis

3. **Equitable Insights**
   - Success metric: Platform highlights regions with low greenspace AND high disadvantage
   - LLM narrative generates actionable insights for planners

4. **Performance & Reliability**
   - Success metric: Map loads in <3s; interactions respond <200ms
   - Zero unplanned downtime during prototype phase

---

## Technical Specifications

### Integration Points

**Mapbox GL JS**
- Raster tile endpoint: `https://s3.example.com/tiles/{z}/{x}/{y}.pbf` (Cloud-Optimized GeoTIFF or MBTiles)
- Administrative boundary layers (GeoJSON or vector tiles)
- Layer toggling and opacity control
- Custom popup on region click → fetch detailed stats

**Supabase (PostgreSQL + PostGIS)**
- Tables:
  - `cities` (id, name, boundary, center, initial_zoom, geographies)
  - `regions` (id, city_id, geography_type, name, geometry)
  - `region_stats` (region_id, area_km2, class_proportions, greenspace_index, greenspace_percentile, computed_at, model_version)
  - `indicators` (id, name, description, source, data_year, geography_type, update_frequency, license)
  - `indicator_values` (region_id, indicator_id, value, percentile, data_year, confidence)
  - `correlations` (indicator_id, city_id, correlation, p_value, computed_at)

- Key PostGIS functions:
  - `ST_Intersects()` — find regions containing clicked point
  - `ST_Area()` — compute region area
  - `ST_Buffer()` — expand user-drawn AOI by tolerance
  - `ST_Within()` — validate AOI is within city boundary

**Google Earth Engine (Optional)**
- Used during data prep phase to compute zonal statistics if not precomputed
- Not required for MVP frontend; deferred to backend pipeline

**OpenAI GPT-4 (Grounded Narrative)**
- Endpoint: `POST /api/interpret`
- Prompt template: "Region {name} in {city} has {greenspace_index}% greenspace (percentile {p}). Key indicators: {indicator_list}. Generate 100–200-word explanation of greenspace-equity relationship."
- Safety guard: regex to prevent hallucinated statistics; all numbers fact-checked against region data

**S3 / Cloudinary**
- Raster tiles: `s3://bucket/tiles/{city}/{z}/{x}/{y}.pbf`
- Exported maps: `s3://bucket/exports/{session_id}/map-{timestamp}.png` (pre-signed URL, expires 7 days)
- CSV exports: `s3://bucket/exports/{session_id}/data-{timestamp}.csv`

### Security Requirements

- **Public Access**: No authentication required for MVP; all data is aggregated to official geographies (no PII)
- **Input Validation**:
  - AOI polygon size capped (max 1,000 km²)
  - AOI must be valid GeoJSON polygon
  - String inputs sanitized (regex whitelist for region names, city slugs)
- **API Rate Limiting**: 60 req/min per IP (standard), 10 req/min for compute-heavy endpoints (interpret, stats/aoi)
- **HTTPS Only**: All API endpoints require HTTPS; HSTS headers enforced
- **CORS**: Restricted to `localhost:3000` (dev), `greenspace-app.vercel.app` (prod)
- **Secrets**: API keys (Mapbox, OpenAI, Supabase) stored in `.env.local` (never in git)

---

## Design Specifications

### Visual Layout & Components

**Landing Page** (`/`)
```
┌─────────────────────────────────────────┐
│  Header: Logo | Navigation | About      │
├─────────────────────────────────────────┤
│                                         │
│   Hero Section:                         │
│   "Explore Greenspace Inequity"         │
│   Subtitle + 2-3 key features           │
│                                         │
│   City Selector Grid:                   │
│   ┌─────────┐ ┌─────────┐              │
│   │Singapore│ │  Perth  │              │
│   │ [Logo]  │ │ [Logo]  │              │
│   └─────────┘ └─────────┘              │
│                                         │
│   Browse Data Catalogue (optional)      │
│                                         │
├─────────────────────────────────────────┤
│  Footer: License | Data | Legal        │
└─────────────────────────────────────────┘
```

**Explorer Page** (`/explorer?city=singapore`)
```
┌────────────────────────────────────────────────┐
│  Header: Logo | City Select | Help            │
├──────────────┬────────────────────────────────┤
│              │                                │
│  Layer Panel │      MapContainer              │
│  (240px)     │      (Mapbox GL)               │
│              │                                │
│  ├─ Raster   │                                │
│  │ └─opacity │                                │
│  │           │      [Click region → popup]    │
│  ├─Boundaries│                                │
│  │ └─opacity │                                │
│  │           │                                │
│  ├─Legend    │                                │
│  │           │                                │
│  ├─Search    │                                │
│  │           │                                │
│              │                                │
├──────────────┼────────────────────────────────┤
│              │                                │
│ RegionStats  │  ComparisonPanel (if pinned)  │
│ Sidebar      │  ┌──────────────────────────┐  │
│ (320px)      │  │ Region A | Region B      │  │
│              │  ├──────────────────────────┤  │
│ Region Name  │  │ Greenspace: 45% | 38%   │  │
│ Area: 5.2km² │  │ Pop: 120K | 95K          │  │
│ Greenspace   │  │ Indicators: ...          │  │
│ Index: 52%   │  └──────────────────────────┘  │
│ (percentile) │                                │
│              │                                │
│ Indicators   │                                │
│ ├─ Pop.      │                                │
│ ├─ Median    │                                │
│ │   Income   │                                │
│ └─ Car       │                                │
│    Owners    │                                │
│              │                                │
│ [Explain]    │                                │
│ [Compare]    │                                │
│ [Export]     │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

**Design System Compliance**

*Color Palette (Kairos Capital Premium)*
```css
--primary-ink: #031926;              /* Deep ink */
--primary-teal: #007B7A;             /* Finance confidence */
--primary-cerulean: #00B3C6;         /* Clarity accent */
--primary-gold: #C9A84A;             /* Prestige highlights */

--success: #28A745;                  /* Greenspace presence */
--warning: #FFB74D;                  /* Low greenspace alert */
--error: #DC3545;                    /* Unavailable data */
--info: #00A3B2;                     /* Kairos teal info */

--bg-primary: #FFFFFF;               /* Clean white */
--bg-secondary: #F6F8F8;             /* Off-white */
--bg-dark: #031926;                  /* Deep ink sections */

--text-primary: #0E1B20;             /* Near-black */
--text-secondary: #4F6467;           /* Muted teal-gray */
--text-muted: #8A9899;               /* Subtle hints */
```

*Typography*
- Headings: Merriweather (serif) — refined, trustworthy
- Body: Inter (sans-serif) — clean, readable
- Monospace: JetBrains Mono (for numbers, indices)

*Spacing & Layout*
- Grid: 12-column, max width 1400px
- Gutters: 24px (desktop), 16px (tablet), 12px (mobile)
- Card shadow: `0 6px 18px rgba(2,18,22,0.06)`
- Transitions: 300ms ease (professional, not flashy)

*Responsive Breakpoints*
- Mobile: < 640px (single column, full-width map)
- Tablet: 640px–1023px (2-column layout)
- Desktop: 1024px+ (3-column: sidebar, map, stats)

### Interaction Patterns

**Region Selection**
- Click on map → highlight region boundary + display popup with name
- Popup shows: region name, greenspace index, percentile, key indicators
- Popup has buttons: "View Details" → expand sidebar | "Compare" → pin region

**Layer Toggling**
- Toggle switches in Layer Panel
- Raster + opacity slider (0–100%)
- Boundaries + opacity slider
- Real-time map update (<100ms response)

**Comparison Workflow**
- User selects region A
- Clicks "Compare" button → region A pinned to comparison panel
- User clicks different region B
- Comparison panel shows side-by-side metrics
- Difference highlighted: green if region B better, amber if worse

---

## Technical Architecture

### Component Structure

```
app/
├── (public)/
│   ├── page.tsx                              # Landing (CitySelector)
│   ├── explorer/
│   │   ├── page.tsx                          # Explorer entry
│   │   ├── layout.tsx                        # Explorer layout
│   │   ├── loading.tsx                       # Loading state
│   │   ├── error.tsx                         # Error boundary
│   │   └── components/
│   │       ├── MapContainer.tsx              # Mapbox GL wrapper (client)
│   │       ├── LayerPanel.tsx                # Layer toggles + legend
│   │       ├── RegionStatsPanel.tsx          # Region details sidebar
│   │       ├── SearchBar.tsx                 # Region search
│   │       ├── ComparisonPanel.tsx           # Side-by-side compare
│   │       ├── ExportModal.tsx               # Export dialog
│   │       ├── IndicatorList.tsx             # Scrollable indicators table
│   │       ├── LegendComponent.tsx           # Dynamic legend (raster classes)
│   │       └── hooks/
│   │           ├── useMapState.ts            # City, selected region, pinned
│   │           ├── useRegionStats.ts         # Fetch region statistics
│   │           ├── useIndicators.ts          # Load indicators catalogue
│   │           ├── useCorrelation.ts         # Fetch correlation matrix
│   │           ├── useInterpret.ts           # Call LLM narrative API
│   │           └── useExport.ts              # Handle exports
│   └── layout.tsx                            # Root layout
│
├── api/
│   ├── cities/
│   │   └── route.ts                          # GET /api/cities
│   ├── regions/
│   │   └── route.ts                          # GET /api/regions
│   ├── stats/
│   │   ├── route.ts                          # GET /api/stats/city, POST /api/stats/aoi
│   │   ├── [region_id]/
│   │   │   └── route.ts                      # GET /api/stats/[region_id]
│   │   └── aoi/
│   │       └── route.ts                      # POST /api/stats/aoi (zonal compute)
│   ├── indicators/
│   │   ├── route.ts                          # GET /api/indicators (catalogue)
│   │   └── [indicator_id]/
│   │       └── route.ts                      # GET /api/indicators/[indicator_id]
│   ├── relationships/
│   │   └── route.ts                          # GET /api/relationships
│   └── interpret/
│       └── route.ts                          # POST /api/interpret (LLM)
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Select.tsx
│   │   ├── Toggle.tsx
│   │   ├── Legend.tsx
│   │   ├── Loading.tsx
│   │   └── Alert.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── features/
│       ├── CitySelector/
│       │   ├── CityCard.tsx
│       │   └── CityGrid.tsx
│       ├── ExplorerLayout/
│       │   └── ExplorerLayout.tsx
│       └── Analysis/
│           ├── ScatterplotChart.tsx
│           └── BivariateMap.tsx
│
├── hooks/
│   ├── useMapState.ts                        # City, selected, pinned region state
│   ├── useRegionStats.ts                     # Memoized stats fetching
│   └── useLocalStorage.ts                    # Persist user preferences
│
├── lib/
│   ├── api/
│   │   ├── supabase.ts                       # Supabase client setup
│   │   ├── stats-service.ts                  # Zonal stat computations
│   │   └── validate-aoi.ts                   # AOI validation & checks
│   ├── geospatial/
│   │   ├── tile-utils.ts                     # Tile coordinate math
│   │   └── bbox.ts                           # Bounding box utilities
│   ├── data/
│   │   ├── cities-config.ts                  # Singapore + Perth config
│   │   ├── colour-schemes.ts                 # WCAG AA accessible palettes
│   │   └── constants.ts                      # Magic numbers (AOI limits)
│   └── utils/
│       ├── format.ts                         # formatNumber, formatPercentile
│       ├── validation.ts                     # Input sanitization
│       └── export.ts                         # CSV generation, map rendering
│
├── services/
│   ├── cityService.ts                        # GET /cities, load boundaries
│   ├── regionService.ts                      # GET /regions, search
│   ├── statsService.ts                       # GET /stats, POST /stats/aoi
│   ├── indicatorService.ts                   # GET /indicators
│   ├── relationshipService.ts                # GET /relationships
│   ├── interpretService.ts                   # POST /interpret
│   └── tileService.ts                        # Tile URL construction
│
├── types/
│   ├── city.ts                               # City, Geography, Boundary
│   ├── region.ts                             # Region, RegionStats
│   ├── indicator.ts                          # Indicator, IndicatorValue
│   ├── api.ts                                # ApiResponse, Paginated
│   └── map.ts                                # Layer, Legend, Selection
│
├── constants/
│   ├── index.ts
│   ├── aoi-limits.ts                         # Max 1000 km², etc.
│   ├── class-colors.ts                       # WCAG AA colors
│   └── api-endpoints.ts
│
├── styles/
│   ├── globals.css                           # Kairos palette, typography
│   ├── tailwind.config.js
│   └── variables.css                         # CSS custom properties
│
├── public/
│   ├── brand/
│   │   ├── kairos-logo-light.svg
│   │   └── kairos-logo-dark.svg
│   └── tiles/                                # Tile references or examples
│
├── docs/
│   ├── stories/                              # User stories 05-14
│   ├── technical-description/                # Technical spec
│   └── implementation-plans/                 # This file + roadmap
│
├── __tests__/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── validate-aoi.test.ts
│   │   │   └── format.test.ts
│   │   └── utils/
│   │       └── tile-utils.test.ts
│   ├── components/
│   │   ├── MapContainer.test.tsx
│   │   └── RegionStatsPanel.test.tsx
│   └── e2e/
│       └── explorer.spec.ts                  # Full user flow
│
├── .env.example
├── .env.local                                # (gitignored)
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── README.md
```

### State Management Architecture

**Global State (React Context)**
```typescript
interface AppContext {
  // City & Geography
  selectedCity: City | null;
  selectedGeography: Geography | null;
  cities: City[];
  
  // Map & Selection
  selectedRegion: Region | null;
  pinnedRegion: Region | null;
  selectedIndicators: string[];
  
  // Data Cache
  regionStats: Map<string, RegionStats>;
  indicatorValues: Map<string, IndicatorValue>;
  correlations: CorrelationEntry[];
}

// Actions
interface AppActions {
  setSelectedCity: (city: City) => void;
  setSelectedRegion: (region: Region | null) => void;
  setPinnedRegion: (region: Region | null) => void;
  selectIndicators: (ids: string[]) => void;
  loadCities: () => Promise<void>;
}
```

**Local Component State**
```typescript
// MapContainer
interface MapState {
  center: [number, number];
  zoom: number;
  layers: {
    raster: { visible: true; opacity: 0.8 };
    boundaries: { visible: true; opacity: 1 };
  };
}

// RegionStatsPanel
interface RegionStatsPanelState {
  isLoadingStats: boolean;
  stats: RegionStats | null;
  error: string | null;
  indicators: IndicatorValue[];
}

// ComparisonPanel
interface ComparisonState {
  regionA: Region | null;
  regionB: Region | null;
  compareMode: 'side-by-side' | 'difference';
}
```

### API Integration Schema

**GET /api/cities**
```json
{
  "success": true,
  "data": [
    {
      "id": "singapore",
      "name": "Singapore",
      "region": "Southeast Asia",
      "center": [103.8198, 1.3521],
      "initialZoom": 11,
      "boundary": { "type": "Polygon", "coordinates": [...] },
      "geographies": [
        { "id": "subzone", "label": "Subzone", "tableName": "sg_subzones" }
      ],
      "rasterMeta": {
        "tileUrl": "https://s3.../tiles/singapore/{z}/{x}/{y}.pbf",
        "minZoom": 10,
        "maxZoom": 15,
        "classes": [
          { "value": 0, "name": "water", "color": "#4FC3F7", "altColor": "#0277BD" },
          { "value": 1, "name": "urban", "color": "#CFD8DC", "altColor": "#455A64" },
          { "value": 2, "name": "green_residential", "color": "#81C784", "altColor": "#2E7D32" },
          { "value": 3, "name": "parkland", "color": "#28A745", "altColor": "#1B5E20" }
        ],
        "resolution": 10,
        "releaseDate": "2024-06"
      },
      "censusVintage": 2020,
      "modelVersion": "v1.0-202406"
    }
  ]
}
```

**GET /api/regions?cityId=singapore&geography=subzone**
```json
{
  "success": true,
  "data": [
    {
      "id": "sg-ang-mo-kio",
      "name": "Ang Mo Kio",
      "cityId": "singapore",
      "geographyType": "subzone",
      "geometry": { "type": "Polygon", "coordinates": [...] }
    }
  ]
}
```

**GET /api/stats/region/:regionId**
```json
{
  "success": true,
  "data": {
    "regionId": "sg-ang-mo-kio",
    "areaKm2": 13.7,
    "population": 330000,
    "classProportions": {
      "water": 0.05,
      "urban": 0.45,
      "green_residential": 0.35,
      "parkland": 0.15
    },
    "greensapeIndex": 50,
    "greensacePercentile": 62,
    "computedAt": "2024-12-15T10:00:00Z",
    "modelVersion": "v1.0-202406"
  }
}
```

**POST /api/stats/aoi**
```json
{
  "success": true,
  "data": {
    "id": "aoi-session-xyz",
    "name": "Custom Area",
    "geometry": { "type": "Polygon", "coordinates": [...] },
    "stats": {
      "areaKm2": 5.2,
      "classProportions": { "water": 0, "urban": 0.4, "green_residential": 0.4, "parkland": 0.2 },
      "greensapeIndex": 60,
      "computedAt": "2024-12-15T10:05:00Z"
    },
    "validationResult": {
      "isValid": true,
      "warnings": [],
      "areaKm2": 5.2,
      "pixelCount": 52000,
      "computeEstimate": "< 1s"
    }
  }
}
```

**GET /api/indicators?cityId=singapore**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pop-density",
        "name": "Population Density",
        "description": "People per km²",
        "source": "ABS Census 2020",
        "dataYear": 2020,
        "geography": "subzone",
        "license": "CC BY 4.0",
        "correlationWithGreenspace": -0.42
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 20
  }
}
```

**POST /api/interpret**
```json
{
  "success": true,
  "data": {
    "narrative": "Ang Mo Kio has 50% greenspace coverage (62nd percentile in Singapore), which is above average. This region combines moderate green residential areas with significant urban development. Population density is high (330K in 13.7km²), suggesting a mixed-use urban environment with accessible green spaces. Recommendations: maintain current parkland accessibility; consider expanding green_residential zones to address high-density areas.",
    "limitations": ["Raster model accuracy ±5%", "Census data from 2020; updated 2024"]
  }
}
```

---

## Implementation Requirements

### Phase 1: Foundation & Setup (Weeks 1-2, Estimates: 8-10 days)

**Deliverables:**
- Project scaffolding (Next.js app router, TypeScript, Tailwind config)
- Supabase database schema (cities, regions, stats tables)
- Singapore + Perth boundaries + administrative regions loaded
- Basic page structure (landing + explorer layout)
- Kairos Capital design tokens integrated (CSS variables)

**Tasks:**
1. Initialize Next.js 15 project with TypeScript + Tailwind
2. Configure Supabase connection (local dev + staging)
3. Create database schema (migrations)
4. Seed cities data (Singapore + Perth config)
5. Load region geometries (GeoJSON import)
6. Create type definitions (City, Region, RegionStats, Indicator, ApiResponse)
7. Build landing page UI (CitySelector, CityCard components)
8. Build explorer layout shell (Header, Footer, sidebars)
9. Set up CSS design tokens (Kairos palette, typography, spacing)
10. Document setup instructions (README, .env.example)

**Dependencies:**
- `mapbox-gl`, `react-map-gl` (mapping)
- `@supabase/supabase-js` (database)
- `tailwindcss`, PostCSS
- TypeScript, `next/types`

**Acceptance Criteria:**
- Landing page renders CitySelector with Singapore + Perth cards
- Explorer layout renders without errors (empty map)
- Supabase connection confirmed (run seed script)
- TypeScript strict mode passes with zero errors
- All design tokens applied (color, typography, spacing)

---

### Phase 2: Map & Data Integration (Weeks 3-4, Estimates: 10-12 days)

**Deliverables:**
- Mapbox GL integration (raster tiles + boundary layers)
- Region statistics API endpoints (/api/stats)
- Region click-to-select interaction + popup
- Layer panel with toggles + opacity controls
- Region stats sidebar with basic metrics display
- Statistics precomputed and cached in PostGIS

**Tasks:**
1. Set up Mapbox GL JS wrapper component (MapContainer)
2. Load raster tiles (configure tile server or S3 endpoint)
3. Load administrative boundary GeoJSON as vector layer
4. Implement click detection (findFeaturesAtPoint)
5. Build popup component with region name + basic stats
6. Create LayerPanel component (toggle switches, opacity slider)
7. Implement layer state management (useMapState hook)
8. Build RegionStatsPanel (display selected region stats)
9. Implement stats fetching (/api/stats/[region_id]) with memoization
10. Precompute greenspace index + percentile for all regions
11. Add loading + error states throughout
12. Write unit tests for API endpoints

**Dependencies:**
- `mapbox-gl` v3.x
- `geotiff` (if processing COG locally)
- PostGIS functions (ST_Intersects, ST_Area, ST_Contains)

**Acceptance Criteria:**
- Map renders raster overlay + boundaries without lag
- Click region → popup appears with region name
- Layer toggles update map in real-time (<100ms)
- RegionStatsPanel shows greenspace index + percentile
- All stats precomputed; no client-side calculation
- API response times <500ms

---

### Phase 3: Indicators & Analysis (Weeks 5-6, Estimates: 10-12 days)

**Deliverables:**
- Indicators catalogue API (/api/indicators)
- Indicator values loaded for all regions + cities
- IndicatorList component (scrollable, sortable table)
- Indicator percentile calculation + display
- Correlation matrix precomputed (/api/relationships)
- Bivariate classification logic (low/high greenspace × low/high indicator)
- Scatter plot visualization (greenspace vs selected indicator)

**Tasks:**
1. Load indicator metadata into Supabase (name, source, license, fields)
2. Load indicator values for all regions (census data)
3. Create /api/indicators endpoint with pagination + search
4. Create /api/indicators/[id] endpoint
5. Implement IndicatorList component (table with sort/filter)
6. Add percentile badges + confidence indicators
7. Precompute correlation matrix (Pearson r, p-value)
8. Create /api/relationships endpoint (correlation + bivariate)
9. Build ScatterplotChart component (using Chart.js or Recharts)
10. Implement BivariateMap visualization (2×2 grid colors)
11. Create AnalysisPanel (tab in sidebar, triggered by indicator selection)
12. Write component tests for IndicatorList + ScatterplotChart

**Dependencies:**
- `recharts` or `chart.js` (charting library)
- `lodash` (percentile calculation)
- Math.js (correlation computation)

**Acceptance Criteria:**
- Indicator catalogue displays 8+ indicators with metadata
- Indicator values load + display in table (500ms)
- Percentile ranks calculated correctly (verified against manual sample)
- Scatter plot renders with trendline + Pearson r displayed
- Bivariate map colors match 2×2 classification
- Correlation matrix precomputed; no real-time calc

---

### Phase 4: Comparison & Export (Weeks 7-8, Estimates: 10-12 days)

**Deliverables:**
- Region comparison workflow (pin region A, select region B)
- ComparisonPanel side-by-side display
- Export functionality (map PNG, CSV, narrative)
- LLM-powered narrative interpretation
- Export modal with preview + download
- Rate limiting on compute-heavy endpoints

**Tasks:**
1. Implement region pinning logic (useMapState hook)
2. Build ComparisonPanel component (side-by-side metrics)
3. Add diff highlighting (green if region B better, amber if worse)
4. Create "Explain" button → trigger LLM interpretation
5. Build /api/interpret endpoint (call OpenAI GPT-4 with grounded prompt)
6. Implement safety guardrails (regex fact-check against region stats)
7. Create ExportModal component (tabs: Map, Data, Narrative)
8. Implement map PNG export (use canvas rendering or headless browser)
9. Implement CSV export (generate + stream to user)
10. Implement narrative export (download as DOCX or PDF)
11. Add rate limiting middleware (/api/interpret: 3 req/min, /api/stats/aoi: 10 req/min)
12. Test export functionality with sample data

**Dependencies:**
- `openai` (GPT-4 API)
- `html2canvas` or `puppeteer` (map screenshot)
- `papaparse` (CSV generation)
- `docx` or `pdfkit` (document export)
- `express-rate-limit` (if backend is NestJS/Express)

**Acceptance Criteria:**
- Pin region A, click region B → comparison shows immediately
- "Explain" button calls LLM; narrative appears in <3s (with loading spinner)
- Narrative is factually accurate (fact-checked against precomputed stats)
- Map export PNG renders correctly with legend + region highlight
- CSV export includes all regions + indicators with headers
- Narrative export downloads as DOCX/PDF with formatting
- Rate limiting enforced; requests over limit return 429 error

---

### Phase 5: Polish & Testing (Weeks 9-10, Estimates: 8-10 days)

**Deliverables:**
- Accessibility improvements (WCAG 2.1 AA)
- Responsive design refinements (mobile, tablet, desktop)
- Performance optimizations (bundle size, core web vitals)
- Unit + integration tests (90%+ coverage on critical paths)
- E2E tests (user workflows)
- Error boundary + loading states
- Deployment to staging environment

**Tasks:**
1. Run accessibility audit (axe DevTools, Lighthouse)
2. Add ARIA labels to interactive elements
3. Test keyboard navigation (Tab through all interactive elements)
4. Test screen reader compatibility (NVDA, JAWS)
5. Implement responsive design refinements (mobile-first)
6. Add error boundary component (global fallback UI)
7. Implement proper loading states (skeleton screens, spinners)
8. Code split dynamic components (Mapbox GL, chart libraries)
9. Analyze bundle size; tree-shake unused code
10. Write unit tests (Jest): API handlers, data formatting, validation
11. Write component tests (React Testing Library): MapContainer, RegionStatsPanel, ExportModal
12. Write E2E tests (Playwright): full user flows (select city → view stats → compare → export)
13. Deploy to staging environment (Vercel preview)
14. Smoke tests on staging

**Dependencies:**
- `jest`, `@testing-library/react`
- `playwright` (E2E testing)
- `@axe-core/react` (accessibility testing)
- `lighthouse` (performance audit)

**Acceptance Criteria:**
- WCAG 2.1 AA compliance verified
- All interactive elements keyboard-accessible
- Lighthouse scores: Accessibility ≥95, Performance ≥90
- 90%+ test coverage on critical paths
- All user workflows pass E2E tests
- Load time <3s on slow 3G network
- No console errors/warnings

---

### Phase 6: Production Launch & Monitoring (Week 11, Estimates: 4-5 days)

**Deliverables:**
- Production deployment (Vercel frontend, DB backup)
- Monitoring + alerting configured
- Analytics tracking setup
- Documentation finalized
- Handoff to stakeholders

**Tasks:**
1. Set up production environment variables (Mapbox, OpenAI, Supabase prod)
2. Configure HSTS, CORS, CSP headers
3. Set up error logging (Sentry or LogRocket)
4. Configure performance monitoring (Web Vitals, API latency)
5. Set up alerting (Slack notifications for errors)
6. Implement analytics tracking (Google Analytics or Mixpanel)
7. Create production runbook (deployment, rollback, troubleshooting)
8. Write user documentation (feature guide, data glossary)
9. Deploy to production (canary release: 10% → 50% → 100%)
10. Monitor for 24 hours post-launch
11. Prepare handoff documentation

**Dependencies:**
- `@sentry/nextjs` (error logging)
- `web-vitals` (performance metrics)
- Google Analytics 4 or Mixpanel SDK

**Acceptance Criteria:**
- Zero unplanned downtime during launch
- Error rate <0.1%
- API response times <500ms (p95)
- 99.9% uptime SLA maintained
- All monitoring alerts firing correctly
- User documentation complete + accessible

---

## Modified Files & Lines of Code (LOC) Estimate

| File | Type | Status | LOC Estimate |
|------|------|--------|--------------|
| `app/(public)/page.tsx` | Component | ⬜ NEW | 80 |
| `app/(public)/explorer/page.tsx` | Page | ⬜ NEW | 50 |
| `app/(public)/explorer/layout.tsx` | Layout | ⬜ NEW | 40 |
| `app/(public)/explorer/components/MapContainer.tsx` | Component | ⬜ NEW | 250 |
| `app/(public)/explorer/components/LayerPanel.tsx` | Component | ⬜ NEW | 150 |
| `app/(public)/explorer/components/RegionStatsPanel.tsx` | Component | ⬜ NEW | 200 |
| `app/(public)/explorer/components/ComparisonPanel.tsx` | Component | ⬜ NEW | 180 |
| `app/(public)/explorer/components/ExportModal.tsx` | Component | ⬜ NEW | 200 |
| `app/(public)/explorer/components/IndicatorList.tsx` | Component | ⬜ NEW | 150 |
| `app/(public)/explorer/components/hooks/useMapState.ts` | Hook | ⬜ NEW | 80 |
| `app/(public)/explorer/components/hooks/useRegionStats.ts` | Hook | ⬜ NEW | 100 |
| `app/(public)/explorer/components/hooks/useIndicators.ts` | Hook | ⬜ NEW | 100 |
| `app/(public)/explorer/components/hooks/useInterpret.ts` | Hook | ⬜ NEW | 80 |
| `app/api/cities/route.ts` | API | ⬜ NEW | 60 |
| `app/api/regions/route.ts` | API | ⬜ NEW | 80 |
| `app/api/stats/route.ts` | API | ⬜ NEW | 120 |
| `app/api/stats/[region_id]/route.ts` | API | ⬜ NEW | 70 |
| `app/api/stats/aoi/route.ts` | API | ⬜ NEW | 150 |
| `app/api/indicators/route.ts` | API | ⬜ NEW | 100 |
| `app/api/indicators/[indicator_id]/route.ts` | API | ⬜ NEW | 60 |
| `app/api/relationships/route.ts` | API | ⬜ NEW | 80 |
| `app/api/interpret/route.ts` | API | ⬜ NEW | 120 |
| `components/ui/Button.tsx` | Component | ⬜ NEW | 50 |
| `components/ui/Card.tsx` | Component | ⬜ NEW | 40 |
| `components/ui/Legend.tsx` | Component | ⬜ NEW | 100 |
| `lib/api/supabase.ts` | Utility | ⬜ NEW | 40 |
| `lib/api/validate-aoi.ts` | Utility | ⬜ NEW | 80 |
| `lib/data/cities-config.ts` | Config | ⬜ NEW | 150 |
| `lib/data/colour-schemes.ts` | Config | ⬜ NEW | 100 |
| `lib/utils/format.ts` | Utility | ⬜ NEW | 80 |
| `lib/utils/export.ts` | Utility | ⬜ NEW | 120 |
| `services/cityService.ts` | Service | ⬜ NEW | 60 |
| `services/regionService.ts` | Service | ⬜ NEW | 70 |
| `services/statsService.ts` | Service | ⬜ NEW | 100 |
| `services/indicatorService.ts` | Service | ⬜ NEW | 90 |
| `services/relationshipService.ts` | Service | ⬜ NEW | 80 |
| `services/interpretService.ts` | Service | ⬜ NEW | 70 |
| `types/*.ts` | Types | ⬜ NEW | 300 |
| `styles/globals.css` | Styles | ⬜ NEW | 200 |
| `__tests__/unit/**/*.test.ts` | Tests | ⬜ NEW | 400 |
| `__tests__/components/**/*.test.tsx` | Tests | ⬜ NEW | 500 |
| `__tests__/e2e/**/*.spec.ts` | Tests | ⬜ NEW | 300 |
| **Total** | | | **~5,200** |

---

## Testing Strategy

### Unit Tests (Jest)
```typescript
// Example: validate-aoi.test.ts
describe('validateAOI', () => {
  it('should reject AOI > 1000 km²', () => {
    const largeAOI = { /* 2000 km² polygon */ };
    const result = validateAOI(largeAOI);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('AOI_TOO_LARGE');
  });

  it('should accept valid AOI within city boundary', () => {
    const validAOI = { /* 500 km² polygon */ };
    const result = validateAOI(validAOI, singaporeBoundary);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
```

### Component Tests (React Testing Library)
```typescript
// Example: MapContainer.test.tsx
describe('<MapContainer />', () => {
  it('should render map and load tiles', () => {
    const { getByTestId } = render(<MapContainer city={singapore} />);
    const mapContainer = getByTestId('mapbox-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should display region popup on click', async () => {
    const { getByText } = render(<MapContainer city={singapore} />);
    fireEvent.click(screen.getByTestId('region-feature'));
    await waitFor(() => expect(getByText('Ang Mo Kio')).toBeInTheDocument());
  });
});
```

### E2E Tests (Playwright)
```typescript
// Example: explorer.spec.ts
test.describe('Explorer Full User Flow', () => {
  test('user selects Singapore, clicks region, views stats, exports', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('text=Singapore');
    // Map loads
    await expect(page.locator('[data-testid="mapbox-canvas"]')).toBeVisible();
    // Click region
    await page.click('[data-testid="region-ang-mo-kio"]');
    // Stats panel appears
    await expect(page.locator('text=Ang Mo Kio')).toBeVisible();
    // Export
    await page.click('text=Export');
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Download CSV');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
```

### Test Coverage Goals
- Unit tests: 85%+ coverage on lib/, services/, utils/
- Component tests: 80%+ coverage on UI components
- Critical paths: 100% coverage (user workflows)
- Total: 90%+ project-wide coverage

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation | Contingency |
|------|--------|-----------|-----------|------------|
| Mapbox GL performance with large rasters | High | Medium | Pre-tile rasters; test with 10GB+ data | Use Leaflet fallback; reduce max zoom |
| PostGIS query timeouts on AOI compute | High | Low | Index geometries; set query timeout 5s | Queue async jobs; return cached estimate |
| OpenAI API latency/cost | Medium | Medium | Cache narratives; implement fallback | Hardcode example narratives for demo |
| Data quality issues (census vintage) | Medium | Low | Validate all indicators before load | Document data limitations prominently |
| Browser compatibility (older IE) | Low | High | Progressive enhancement; polyfills | Graceful degradation; recommend Chrome |

### Business Risks

| Risk | Impact | Likelihood | Mitigation | Contingency |
|------|--------|-----------|-----------|------------|
| Scope creep (more cities/indicators) | High | High | Freeze scope after Perth+Singapore | Phase 2: Add more cities; maintain MVP freeze |
| Stakeholder feedback delays | Medium | Medium | Weekly syncs; clear feedback channels | Proceed with demo + iterate post-launch |
| Data licensing restrictions | Medium | Low | Clarify CC BY 4.0 licenses upfront | Publish data license matrix early |

---

## Deployment Plan

### Development Environment
- Local Next.js dev server (`npm run dev` on port 3000)
- Local Supabase (Docker: `supabase start`)
- Mock tile server (static GeoJSON or local MBTiles)
- Environment: `.env.local` with test credentials

### Staging Environment
- Vercel preview deployment (auto-deployed on PR)
- Supabase staging DB (read replica of prod)
- Production Mapbox credentials (limited quota)
- Manual smoke tests before merge to main

### Production Environment
- Vercel production deployment (auto-deployed on main branch merge)
- Supabase production DB with backups (nightly snapshots)
- Production Mapbox account + full tile quota
- Datadog/Sentry monitoring + alerting
- CDN cache headers on static assets

### Deployment Checklist
- [ ] All tests passing (Jest + Playwright)
- [ ] Lighthouse scores ≥85 across categories
- [ ] WCAG 2.1 AA audit passed
- [ ] Environment variables configured (.env.production)
- [ ] Database migrations applied
- [ ] Backups tested + documented
- [ ] Rollback plan documented
- [ ] On-call rotation assigned
- [ ] Slack notifications configured
- [ ] Analytics tracking verified

---

## Monitoring & Analytics

### Performance Metrics (Web Vitals)
- **LCP (Largest Contentful Paint)**: <2.5s (target: <1.5s for MVP)
- **FID (First Input Delay)**: <100ms (target: <50ms)
- **CLS (Cumulative Layout Shift)**: <0.1 (target: <0.05)

### Business Metrics
- **DAU** (Daily Active Users): Track growth
- **Feature Adoption**: % users who export, compare, interpret
- **Map Interaction Rate**: % clicks per session
- **Export Rate**: % users who download CSV/map

### Technical Metrics
- **API Response Time (p95)**: <500ms
- **Error Rate**: <0.1%
- **Tile Load Time**: <200ms per viewport
- **Database Query Time**: <100ms (with indexing)

### Alerting Rules
- Error rate > 1% → Slack alert
- API response time (p95) > 1s → Page on-call
- Database CPU > 80% → Slack warning
- Disk usage > 85% → Slack warning
- Zero tiles loading for 5 min → Page on-call

---

## Documentation Deliverables

1. **Technical Architecture** ✅ (completed)
2. **Implementation Plan** ✅ (this document)
3. **API Reference** (auto-generated from route.ts JSDoc + Swagger)
4. **Component Storybook** (visual documentation for UI components)
5. **Data Dictionary** (indicator definitions, vintage, source, license)
6. **Deployment Runbook** (step-by-step production procedures)
7. **User Guide** (feature walkthrough, data interpretation guidance)

---

## Success Criteria & Launch Readiness

**Functional:**
- ✅ All user stories (05-14) implemented and tested
- ✅ Singapore + Perth fully loaded with boundaries + statistics
- ✅ Export functionality (map, CSV, narrative) works end-to-end
- ✅ LLM interpretation generates factually accurate narratives

**Performance:**
- ✅ Initial load <3s on 3G network
- ✅ Map interactions respond <200ms
- ✅ API endpoints return <500ms (p95)

**Quality:**
- ✅ 90%+ test coverage (critical paths 100%)
- ✅ WCAG 2.1 AA compliance verified
- ✅ Zero unhandled errors in production

**Operational:**
- ✅ Monitoring + alerting configured
- ✅ Backup + disaster recovery tested
- ✅ On-call rotation in place
- ✅ Documentation complete

---

## Next Steps (Post-MVP)

**Phase 2 (Months 2-3):**
- Add 2-3 additional cities (Melbourne, Sydney, Cape Town)
- Implement user accounts + saved preferences
- Add time-series analysis (greenspace changes 2015–2024)

**Phase 3 (Months 4-6):**
- Build admin dashboard (data ingestion, model versioning)
- Integrate Google Earth Engine for on-demand zonal stats
- Add multi-model comparison (compare different greenspace classification models)

**Phase 4 (Months 7+):**
- Open API for external tools (research, planning platforms)
- Advanced scenario modeling (what if X% more parkland?)
- Community contributed data (crowdsourced greenspace feedback)

