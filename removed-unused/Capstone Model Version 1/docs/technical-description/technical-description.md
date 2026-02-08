# Greenspace & Inequity Mapping Platform - Technical Description

## Application Overview

**Purpose:**
A premium, evidence-based web application for urban planners, researchers, and policy makers to explore greenspace distribution, socioeconomic inequity patterns, and relationships between environmental access and demographic disadvantage. Enables data-driven spatial analysis, comparative region studies, and exportable findings to support targeted interventions in underserved communities.

**Architecture Pattern:** Next.js 15 App Router with Server Components + client-side interactive mapping

**Key Capabilities:**
- Multi-city greenspace classification overlay and choropleth visualization
- Drill-down from city-wide to granular administrative geographies (SA2, wards, neighborhoods)
- Custom area-of-interest (AOI) polygon drawing and on-demand zonal statistics
- Socioeconomic indicator integration with percentile rankings and correlation analysis
- Natural language interpretation (LLM-powered) of regional patterns
- Side-by-side region comparison and bivariate spatial analysis
- Export-ready map images, CSV data, and auto-generated narrative reports
- Layer toggling, transparency controls, and accessibility-first interface design

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server components for precomputed data delivery, built-in API routes, SSG/ISR for static tiles and metadata |
| **Language** | TypeScript | Type safety for data models, API contracts, and geospatial operations |
| **Styling** | Tailwind CSS + CSS Modules | Utility-first for rapid UI iteration; custom CSS for premium Kairos Capital aesthetic |
| **Mapping** | Mapbox GL JS (primary) / Leaflet (fallback) | Raster tile performance, vector rendering, layer management; Mapbox superior for large rasters |
| **State Management** | React Context + Server State | Minimal client state (selected city, active region, pinned comparison); server caching for statistics |
| **Database** | PostGIS (PostgreSQL) | Vector geometry storage, fast zonal queries, spatial indexing for regions and AOI calculations |
| **Object Storage** | S3 or Cloudinary | Raster tiles (COG, MBTiles), exported maps, precomputed layer cache |
| **Data Access** | Supabase (PostgreSQL wrapper) / DuckDB (analytics) | RESTful API or RPC functions; DuckDB for fast analytical queries on aggregated stats |
| **Geospatial Processing** | Google Earth Engine (optional) / GDAL CLI | Lightweight clip-to-boundary, zonal summaries; Earth Engine for cloud processing if available; otherwise precompute |
| **Authentication** | Supabase Auth (optional) / Public read-only (MVP) | OAuth2 for future multi-user / admin access; public-facing MVP requires no auth |
| **LLM Integration** | OpenAI GPT-4 / Anthropic Claude | Grounded narrative generation for region interpretation; constrained prompts to prevent hallucination |
| **Frontend Deployment** | Vercel | Next.js first-class support, automatic SSG/ISR, analytics, serverless functions |
| **Backend Deployment** | Fly.io / Render.com | Database, tile server, optional GEE integration; CDN for static assets |

---

## Project Folder Structure

```
capstone-greenspace/
├── app/                                    # Next.js App Router
│   ├── (public)/                           # Public route group (landing, explorer)
│   │   ├── page.tsx                        # Landing / city selector
│   │   ├── explorer/
│   │   │   ├── page.tsx                    # Main map explorer
│   │   │   ├── layout.tsx                  # Explorer layout
│   │   │   └── components/
│   │   │       ├── MapContainer.tsx        # Mapbox GL wrapper (client)
│   │   │       ├── LayerPanel.tsx          # Layer toggles & opacity
│   │   │       ├── RegionStatsPanel.tsx    # Stats & indicators sidebar
│   │   │       ├── ComparisonPanel.tsx     # Side-by-side compare
│   │   │       └── ExportModal.tsx         # Map/CSV/narrative export
│   │   └── layout.tsx
│   ├── api/                                # API routes
│   │   ├── cities/                         # GET /api/cities
│   │   │   └── route.ts
│   │   ├── regions/                        # GET /api/regions?city=X
│   │   │   └── route.ts
│   │   ├── stats/                          # GET /api/stats/city, POST /api/stats/aoi
│   │   │   ├── route.ts
│   │   │   ├── [region_id]/
│   │   │   │   └── route.ts
│   │   │   └── aoi/
│   │   │       └── route.ts
│   │   ├── indicators/                     # GET /api/indicators (catalogue)
│   │   │   ├── route.ts
│   │   │   └── [indicator_id]/
│   │   │       └── route.ts
│   │   ├── relationships/                  # GET /api/relationships?indicator=X (correlation)
│   │   │   └── route.ts
│   │   ├── interpret/                      # POST /api/interpret (LLM narrative)
│   │   │   └── route.ts
│   │   └── tiles/                          # GET /api/tiles/:z/:x/:y.pbf (optional proxy)
│   │       └── route.ts
│   ├── layout.tsx                          # Root layout
│   └── globals.css                         # Global styles (Kairos palette)
├── components/                             # React components
│   ├── ui/                                 # Base UI (Button, Card, Input, Legend)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Select.tsx
│   │   ├── Toggle.tsx
│   │   ├── Legend.tsx
│   │   ├── Loading.tsx
│   │   └── Alert.tsx
│   ├── layout/                             # Layout shells
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ExplorerLayout.tsx
│   └── features/                           # Feature components
│       ├── CitySelector/
│       │   ├── CityCard.tsx
│       │   ├── GeoJsonUpload.tsx
│       │   └── SelectGeography.tsx
│       ├── MapInterface/
│       │   ├── MapContainer.tsx
│       │   ├── LayerPanel.tsx
│       │   ├── SearchBar.tsx
│       │   └── SelectionTools.tsx
│       ├── RegionDetails/
│       │   ├── RegionSummary.tsx
│       │   ├── IndicatorList.tsx
│       │   ├── PercentileCard.tsx
│       │   └── CompareButton.tsx
│       ├── Analysis/
│       │   ├── ScatterplotChart.tsx
│       │   ├── BivariateMap.tsx
│       │   ├── PriorityTable.tsx
│       │   └── InterpretButton.tsx
│       └── Export/
│           ├── ExportModal.tsx
│           ├── MapExport.tsx
│           ├── CsvExport.tsx
│           └── NarrativeExport.tsx
├── hooks/                                  # Custom React hooks
│   ├── useMapState.ts                      # City, selected region, pinned region
│   ├── useRegionStats.ts                   # Fetch & cache region stats
│   ├── useIndicators.ts                    # Load catalogue & indicator data
│   ├── useCorrelation.ts                   # Fetch correlation matrix
│   ├── useInterpret.ts                     # Call LLM narrative API
│   └── useExport.ts                        # Handle export generation
├── lib/                                    # Utilities & helpers
│   ├── api/
│   │   ├── supabase.ts                     # Supabase client (server & client)
│   │   ├── stats-service.ts                # Zonal stat computations
│   │   └── earth-engine.ts                 # GEE integration (optional)
│   ├── geospatial/
│   │   ├── aoi-validator.ts                # AOI size/scale checks
│   │   ├── zonal-stats.ts                  # Compute stats from raster + geometry
│   │   └── tile-utils.ts                   # Tile coordinate transformations
│   ├── data/
│   │   ├── cities-config.ts                # Preconfigured cities & boundaries
│   │   ├── colour-schemes.ts               # Accessible palettes (standard + colorblind)
│   │   └── constants.ts                    # Magic numbers (AOI limits, etc.)
│   └── utils/
│       ├── format.ts                       # Number formatting, percentiles
│       ├── export.ts                       # CSV generation, map rendering
│       └── validation.ts                   # Input validation
├── services/                               # API clients & business logic
│   ├── cityService.ts                      # GET /cities, load boundaries
│   ├── regionService.ts                    # GET /regions, search by name
│   ├── statsService.ts                     # GET /stats, POST /stats/aoi
│   ├── indicatorService.ts                 # GET /indicators, GET /indicators/:id
│   ├── relationshipService.ts              # GET /relationships (correlation + bivariate)
│   ├── interpretService.ts                 # POST /interpret (LLM call)
│   └── tileService.ts                      # Tile URL construction, caching headers
├── types/                                  # TypeScript definitions
│   ├── city.ts                             # City, Geography, Boundary
│   ├── region.ts                           # Region, RegionStats, Percentile
│   ├── indicator.ts                        # Indicator, FieldMetadata, Catalogue
│   ├── raster.ts                           # ClassBreaks, ClassStats
│   ├── aoi.ts                              # AOI, ValidationError
│   ├── api.ts                              # ApiResponse<T>, ApiError
│   └── map.ts                              # Layer, Legend, SelectionGeometry
├── constants/                              # Application constants
│   ├── index.ts                            # Export all constants
│   ├── aoi-limits.ts                       # Max area, min scale, compute budget
│   ├── class-colors.ts                     # WCAG AA colors for four classes
│   └── api-endpoints.ts                    # Endpoint URLs, timeouts
├── styles/                                 # Global & theme styles
│   ├── globals.css                         # Kairos palette, typography, spacing
│   ├── tailwind.config.js                  # Tailwind theme extensions
│   └── variables.css                       # CSS custom properties (premium aesthetic)
├── public/                                 # Static assets
│   ├── brand/                              # Kairos Capital branding assets
│   │   ├── logo-light.svg
│   │   └── logo-dark.svg
│   └── tiles/                              # Basemaps or tile references
├── docs/                                   # Documentation
│   ├── stories/                            # User stories (05-14)
│   ├── technical-description/              # This file + architecture details
│   ├── api/                                # API reference (auto-generated or manual)
│   └── DEPLOYMENT.md                       # Deployment & infrastructure guide
├── __tests__/                              # Test files (mirror src structure)
│   ├── unit/
│   │   ├── geospatial/
│   │   ├── lib/
│   │   └── services/
│   ├── components/
│   │   └── MapInterface/
│   └── e2e/
│       └── explorer.spec.ts                # Full user flow tests
├── .env.example                            # Environment variable template
├── .env.local                              # (gitignored) Local secrets
├── next.config.js                          # Next.js configuration
├── tsconfig.json                           # TypeScript config
├── tailwind.config.js                      # Tailwind CSS config
├── package.json                            # Dependencies
├── README.md                               # Project overview & setup
└── .github/
    ├── instructions/                       # Coding guidelines
    └── workflows/                          # CI/CD pipelines
```

---

## Data Models

### City & Geography

```typescript
/**
 * @file city.ts
 * @description City configuration and geography definitions
 */

/**
 * Represents a preconfigured city with boundary and analysis geographies
 * @interface City
 */
interface City {
  /** Unique city identifier (lowercase-slug) */
  id: string;
  /** Display name */
  name: string;
  /** Country or region */
  region: string;
  /** Centroid coordinates [lng, lat] for initial map view */
  center: [number, number];
  /** Initial zoom level */
  initialZoom: number;
  /** GeoJSON boundary polygon (or reference to external file) */
  boundary: GeoJSON.Polygon;
  /** Available analysis geographies for this city */
  geographies: Geography[];
  /** Classified raster metadata (model version, date) */
  rasterMeta: RasterMetadata;
  /** Vintage year of census data */
  censusVintage: number;
  /** Greenspace model version/release date */
  modelVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Administrative geography unit (SA2, ward, neighborhood, etc.)
 * @interface Geography
 */
interface Geography {
  /** Unique identifier within city context */
  id: string;
  /** Display name (e.g., "Statistical Area Level 2") */
  label: string;
  /** Table name in PostGIS database */
  tableName: string;
  /** Key field for joining to census data */
  joinKey: string;
  /** Precomputed statistics available at this geography */
  precomputedStats: boolean;
}

/**
 * Raster / classification metadata
 * @interface RasterMetadata
 */
interface RasterMetadata {
  /** Tile URL template (e.g., "s3://bucket/tiles/{z}/{x}/{y}.pbf") */
  tileUrl: string;
  /** Zoom range for tiles */
  minZoom: number;
  maxZoom: number;
  /** Class definitions */
  classes: ClassDefinition[];
  /** Pixel resolution (m) */
  resolution: number;
  /** Release date */
  releaseDate: string;
}

/**
 * Greenspace class definition
 * @interface ClassDefinition
 */
interface ClassDefinition {
  /** Class code (0-3) */
  value: number;
  /** Class name */
  name: 'water' | 'urban' | 'green_residential' | 'parkland';
  /** Hex color for display */
  color: string;
  /** WCAG AA accessible color (for colorblind) */
  altColor: string;
  /** Brief description */
  description: string;
}
```

### Region & Statistics

```typescript
/**
 * @file region.ts
 * @description Region data and computed statistics
 */

/**
 * Represents an administrative region (ward, SA2, etc.)
 * @interface Region
 */
interface Region {
  /** Unique region identifier (scoped to city + geography) */
  id: string;
  /** Region name */
  name: string;
  /** City ID (foreign key) */
  cityId: string;
  /** Geography type (SA2, ward, etc.) */
  geographyType: string;
  /** GeoJSON geometry (polygon) */
  geometry: GeoJSON.Polygon;
  /** Precomputed statistics */
  stats: RegionStats;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Computed greenspace statistics for a region
 * @interface RegionStats
 */
interface RegionStats {
  /** Region ID (foreign key) */
  regionId: string;
  /** Total area (km²) */
  areaKm2: number;
  /** Population (if available from census) */
  population?: number;
  /** Percentage of each class */
  classProportions: {
    water: number;
    urban: number;
    green_residential: number;
    parkland: number;
  };
  /** Composite greenspace index: (green_residential + parkland) % */
  greensapeIndex: number;
  /** City-wide percentile for greenspace index (0-100) */
  greensacePercentile: number;
  /** Computation timestamp */
  computedAt: Date;
  /** Data vintage (raster model version) */
  modelVersion: string;
}

/**
 * Socioeconomic indicator value for a region
 * @interface IndicatorValue
 */
interface IndicatorValue {
  /** Region ID (foreign key) */
  regionId: string;
  /** Indicator ID (foreign key) */
  indicatorId: string;
  /** Numeric or categorical value */
  value: number | string;
  /** City-wide percentile (0-100) */
  percentile: number;
  /** Data vintage year */
  dataYear: number;
  /** Confidence level (high / medium / low) */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * AOI (area-of-interest) polygon with computed stats
 * @interface AOIStats
 */
interface AOIStats {
  /** Unique AOI session ID */
  id: string;
  /** User-provided or auto-generated name */
  name: string;
  /** GeoJSON geometry (polygon) */
  geometry: GeoJSON.Polygon;
  /** Computed stats (same structure as RegionStats) */
  stats: RegionStats;
  /** Validity check result */
  validationResult: ValidationResult;
  createdAt: Date;
}

/**
 * AOI validation result
 * @interface ValidationResult
 */
interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  areaKm2: number;
  pixelCount: number;
  computeEstimate: string; // e.g., "< 2s"
}
```

### Indicators & Catalogue

```typescript
/**
 * @file indicator.ts
 * @description Socioeconomic indicators and data catalogue
 */

/**
 * Socioeconomic indicator (census table, derived index, etc.)
 * @interface Indicator
 */
interface Indicator {
  /** Unique indicator ID */
  id: string;
  /** Display name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Data source (e.g., "ABS Census 2021") */
  source: string;
  /** Vintage year */
  dataYear: number;
  /** Geography unit (SA2, ward, etc.) */
  geography: string;
  /** Update frequency (annual, biennial, etc.) */
  updateFrequency: string;
  /** License type and link */
  license: string;
  licenseUrl: string;
  /** Known limitations */
  limitations: string[];
  /** Recommended use cases */
  recommendedUses: string[];
  /** Field definitions */
  fields: FieldMetadata[];
  /** Correlation with greenspace index (precomputed) */
  correlationWithGreenspace: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data field metadata (variable definition)
 * @interface FieldMetadata
 */
interface FieldMetadata {
  /** Variable name in database */
  variableName: string;
  /** Human-readable label */
  label: string;
  /** Data type (numeric, categorical, etc.) */
  dataType: string;
  /** Units of measurement */
  units?: string;
  /** Calculation or transformation notes */
  calculationNotes?: string;
  /** Percentage non-null (data completeness) */
  completeness: number;
  /** Optional: list of valid categorical values */
  categories?: string[];
}

/**
 * Correlation matrix entry (precomputed)
 * @interface CorrelationEntry
 */
interface CorrelationEntry {
  /** Indicator ID */
  indicatorId: string;
  /** Pearson correlation coefficient with greenspace index */
  correlation: number;
  /** p-value for significance test */
  pValue: number;
  /** Sample size (number of regions) */
  n: number;
  /** Computation date */
  computedAt: Date;
}

/**
 * Bivariate classification (low/high greenspace x low/high indicator)
 * @interface BivariateClassification
 */
interface BivariateClassification {
  /** Region ID */
  regionId: string;
  /** Greenspace index bin (low / high) */
  greensaceBin: 'low' | 'high';
  /** Indicator bin (low / high) */
  indicatorBin: 'low' | 'high';
  /** Display color for 2x2 matrix */
  color: string;
}
```

### API Response Types

```typescript
/**
 * @file api.ts
 * @description API contract types
 */

/**
 * Standardized API response wrapper
 * @interface ApiResponse
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string; // e.g., "INVALID_AOI", "AOI_TOO_LARGE"
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}

/**
 * Pagination for list endpoints
 * @interface Paginated
 */
interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## API Endpoint Specification

### Cities & Geography

```
GET /api/cities
Returns: ApiResponse<City[]>
Description: List all preconfigured cities with metadata
Query Params: (none)
Cache: 24h (static, rarely changes)

GET /api/cities/:cityId
Returns: ApiResponse<City>
Description: Get detailed city config and boundary
Path Params: cityId
Cache: 24h

GET /api/regions?cityId=X&geography=Y
Returns: ApiResponse<Region[]>
Description: List all regions for a city + geography
Query Params: cityId (required), geography (optional, defaults to first available)
Cache: 24h (static geometry)
```

### Statistics & Analysis

```
GET /api/stats/city?cityId=X
Returns: ApiResponse<RegionStats>
Description: City-wide aggregate statistics
Query Params: cityId
Cache: 24h (precomputed)

GET /api/stats/region/:regionId
Returns: ApiResponse<RegionStats>
Description: Statistics for a single region
Path Params: regionId
Cache: 24h (precomputed)

POST /api/stats/aoi
Body: { cityId, geography, geometry: GeoJSON.Polygon }
Returns: ApiResponse<AOIStats>
Description: Compute statistics for user-drawn AOI polygon
Validation: Enforce max area (e.g., 1000 km²), min scale (e.g., 100m pixels)
Rate Limit: 10 requests per minute per IP
Cache: 1h (per geometry hash)
```

### Indicators & Relationships

```
GET /api/indicators?cityId=X&geography=Y
Returns: ApiResponse<Paginated<Indicator>>
Description: Browse data catalogue
Query Params: cityId, geography, limit, offset, search
Cache: 24h

GET /api/indicators/:indicatorId
Returns: ApiResponse<Indicator>
Description: Get full indicator metadata and field dictionary
Path Params: indicatorId
Cache: 24h

GET /api/relationships?indicatorId=X&cityId=Y
Returns: ApiResponse<{ correlation: CorrelationEntry; bivariate: BivariateClassification[] }>
Description: Get correlation with greenspace and bivariate classification
Query Params: indicatorId (required), cityId
Cache: 24h (precomputed)
```

### Interpretation & Export

```
POST /api/interpret
Body: { regionId, cityId, selectedIndicators: string[], customNotes?: string }
Returns: ApiResponse<{ narrative: string; limitations: string[] }>
Description: Generate LLM-powered narrative interpretation
Constraints: Max 300 words, grounded in precomputed data only
Rate Limit: 3 requests per minute per IP (LLM cost control)

POST /api/export/map
Body: { regionId, layersVisible: string[], bounds: BBox }
Returns: PNG (image/png) or URL to S3 signed URL
Description: Generate map image with selected region + layers + legend
Timeout: 30s

POST /api/export/csv
Body: { regionIds: string[], indicators: string[] }
Returns: CSV (text/csv) or URL to S3 signed URL
Description: Export region stats + indicator values as CSV
```

---

## Component Hierarchy

```
App (layout.tsx)
├── Header
│   ├── Logo (Kairos Capital)
│   ├── Navigation (Landing | Explorer | About)
│   └── UserMenu (Auth optional)
└── Main Content
    ├── Landing (/)
    │   ├── CitySelector
    │   │   ├── CityGrid (CityCard × n)
    │   │   └── GeoJsonUpload
    │   └── SelectGeography
    └── Explorer (/explorer)
        ├── MapContainer (Mapbox GL, client)
        │   ├── BaseLayer
        │   ├── RasterTiles (classification overlay)
        │   ├── AdminBoundaries (optional)
        │   ├── SelectionTools (click, box, lasso)
        │   └── ContextLayers (optional: tree canopy, transit, etc.)
        ├── LayerPanel (left sidebar, ~240px)
        │   ├── LayerToggles
        │   │   ├── Raster (opacity slider)
        │   │   ├── Boundaries (opacity slider)
        │   │   └── ContextLayers (checkboxes)
        │   ├── Legend (dynamic, updates with visible layers)
        │   └── SearchBar (find region by name)
        ├── RegionStatsPanel (right sidebar, ~320px)
        │   ├── RegionSummary
        │   │   ├── Region name + area
        │   │   ├── Class proportions (%)
        │   │   └── Greenspace index + percentile
        │   ├── IndicatorList
        │   │   ├── Sortable table (name, value, units, percentile)
        │   │   ├── Confidence badges
        │   │   └── Tooltip on hover
        │   ├── InterpretButton ("Explain")
        │   ├── CompareButton ("Compare")
        │   └── ExportButton ("Export")
        ├── ComparisonPanel (modal/slide-out, if pinned)
        │   ├── Region A (side-by-side metrics)
        │   ├── Region B (side-by-side metrics)
        │   └── Difference highlighting
        ├── AnalysisPanel (tab in sidebar, activated via catalogue)
        │   ├── IndicatorSelector (dropdown)
        │   ├── ScatterplotChart (greenspace vs indicator)
        │   │   └── Pearson r + p-value
        │   ├── BivariateMapToggle
        │   └── PriorityTable (low greenspace + high disadvantage regions)
        └── ExportModal (overlay)
            ├── Map Tab (preview + download PNG)
            ├── Data Tab (CSV preview + download)
            └── Narrative Tab (editable text + download DOCX/PDF)
```

---

## Design & Aesthetic

**Color Palette (Premium, Kairos Capital-inspired):**
- Primary Ink: `#031926` (very deep ink - trust, stability)
- Primary Teal: `#007B7A` (modern finance, confidence)
- Primary Cerulean: `#00B3C6` (clarity and insight)
- Primary Gold: `#C9A84A` (prestige, premium accents)
- Success Green: `#28A745`
- Warning Amber: `#FFB74D`
- Error Red: `#DC3545`

**Typography:**
- Headings: Merriweather (serif) - refined, professional
- Body: Inter (sans-serif) - clean, readable
- Monospace: JetBrains Mono (code/numbers)

**Spacing & Layout:**
- 12-column grid, max width 1400px
- Generous whitespace for premium feel
- Card shadows: subtle elevation (0 6px 18px rgba(2,18,22,0.06))
- Transitions: 300ms ease (professional, not flashy)

**Accessibility:**
- WCAG AA color contrast for all text + backgrounds
- Four colorblind-friendly palette variants for raster classes
- Keyboard navigation (Tab through all interactive elements)
- ARIA labels on buttons, inputs, form fields
- Screen reader tested (no semantic markup omitted)

---

## Security & Data Governance

**Authentication:**
- MVP: Public read-only (no auth required)
- Future: Supabase Auth for registered users / admin dashboards
- Rate limiting: 60 req/min per IP (standard), 10 req/min for compute-heavy endpoints

**Data Protection:**
- No PII stored; all data aggregated at official geographies (SA2, ward, etc.)
- HTTPS only; HSTS headers enforced
- CORS restricted to trusted origins

**License Compliance:**
- All datasets stored with license metadata
- Export includes attribution footer (source, license, vintage date)
- License links verified quarterly

---

## Performance & Scalability

**Rendering:**
- Raster tiles: pre-generated COG + tile server, ~200ms load per viewport
- Boundaries: simplified geometries for display (<10s of KB per region)
- Statistics: precomputed and cached in PostGIS; custom AOI compute capped at 2–3s

**Data Fetching:**
- City & catalogue data: 24h CDN cache (static, rarely changes)
- Statistics: lazy-loaded on region select, memoized in React Context
- Correlation matrix: precomputed, 1MB JSON, cached on CDN

**Bundle Optimization:**
- Next.js SSG for landing page and static metadata
- Dynamic import for Mapbox GL (only loaded in /explorer)
- CSS-in-JS minimized; Tailwind JIT compilation

---

## Testing & Quality Assurance

**Unit Tests:**
- Geospatial utilities: AOI validation, zonal stat logic
- Data transformation: percentile calculation, correlation matrices
- String formatting: number display, CSV generation

**Component Tests:**
- MapContainer: layer toggle, selection updates
- RegionStatsPanel: indicator loading, percentile badges
- ExportModal: CSV/PNG generation

**E2E Tests:**
- User flow: select city → click region → export narrative
- Comparison flow: pin region A → select region B → compare
- Relationship flow: select indicator → view scatterplot + bivariate map

---

## Documentation & Governance

All significant files include JSDoc headers per documentation standards:
```typescript
/**
 * @file MapContainer.tsx
 * @description Interactive map wrapper with Mapbox GL, layer management, and selection tools
 * @module components/features/MapInterface
 * @dependencies mapbox-gl, react-map-gl, @/types/map
 */
```

API endpoints documented in [docs/api/](docs/api/) with request/response examples, rate limits, and cache headers.

---

## Next Steps & Future Enhancements

1. **Phase 1 (MVP):** Landing + explorer + basic stats export (public, no auth)
2. **Phase 2:** LLM interpretation, side-by-side comparison, relationship analysis
3. **Phase 3:** Admin dashboard, data ingestion pipeline, time-series monitoring
4. **Phase 4:** Multi-model comparison, scenario analysis, API for external tools

