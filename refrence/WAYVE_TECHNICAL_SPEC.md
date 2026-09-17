# WAYVE — Technical Specification

> **Status:** Draft / v0.1  
> **Product:** Wayve  
> **Document:** Technical Specification  
> **Last updated:** 2026-09-17

## 1. Purpose

Wayve is a modern, location-aware mobility platform designed to make discovering, planning, and taking trips simpler.

The product should feel like a **calm mobility command center** rather than a conventional map application: users should be able to understand where they are going, compare practical options, start navigation, and keep important trip information in one place.

This specification defines the product architecture, core capabilities, data model, API boundaries, client behavior, non-functional requirements, and implementation plan for the first production-ready version.

---

## 2. Product Principles

1. **Trip first, map second** — the map is a tool; the trip is the primary object.
2. **Fast path to action** — search, choose, and start a journey with minimal interaction.
3. **Progressive disclosure** — show essential information first; reveal detail when requested.
4. **Live by default** — time, distance, ETA, route conditions, and availability should be treated as dynamic data.
5. **Privacy by design** — precise location is requested only when necessary and is never exposed by default.
6. **Mobile-first** — the primary interaction model is touch, glanceability, and one-handed use.
7. **Resilient UX** — degraded network conditions must not make the core journey unusable.
8. **Composable architecture** — routing, places, navigation, accounts, and notifications remain separable services/modules.

---

## 3. Target Platforms

### Primary
- Responsive web application
- Progressive Web App (PWA)
- Mobile-first layouts

### Future
- Native iOS
- Native Android
- Wearable / vehicle companion surfaces

---

## 4. Core User Jobs

Wayve must support these journeys:

### 4.1 Discover
- Search for a destination, place, landmark, address, or saved location.
- See relevant place information.
- See the destination on the map.
- Inspect nearby useful places.

### 4.2 Plan
- Choose an origin and destination.
- Select a travel mode.
- Compare route alternatives.
- View ETA, duration, distance, and major route conditions.
- Start the selected trip.

### 4.3 Navigate
- Follow the active route.
- See current position and route progress.
- Receive turn/step guidance where supported.
- Recalculate when the user leaves the route.
- Surface meaningful incidents or route changes.

### 4.4 Save
- Save places and routes.
- Organize frequent destinations.
- Access recent searches and trips.

### 4.5 Return
- Quickly resume an active or recent trip.
- Reuse frequent destinations without repeating setup.

---

# 5. Feature Scope

## 5.1 Home

The home screen should provide:

- Current/selected location
- Primary destination search
- Recent destinations
- Saved/favorite destinations
- Quick travel-mode actions
- Active-trip resume card
- Nearby/discovery entry point
- Compact map preview where appropriate

### UX rule

The user should be able to go from **Home → destination → route options** without navigating through multiple settings screens.

---

## 5.2 Search

### Inputs
- Free-text destination
- Address
- Place name
- Landmark
- Coordinates
- Previously saved destination

### Search behavior
- Debounced requests
- Autocomplete
- Recent searches
- Fuzzy matching
- Ranking by relevance and proximity
- Search cancellation when a newer query is issued
- Empty/error states

### Result object

```ts
type SearchResult = {
  id: string;
  type: "place" | "address" | "landmark" | "coordinate";
  name: string;
  secondaryLabel?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  category?: string;
};
```

---

## 5.3 Places

A place page may contain:

- Name
- Category
- Address
- Coordinates
- Photos where available
- Opening hours where available
- Contact information where available
- Save action
- Share action
- Directions action
- Nearby places

Place information is provider-dependent and must never be assumed to exist.

---

## 5.4 Route Planning

A route request contains:

```ts
type RouteRequest = {
  origin: Coordinate;
  destination: Coordinate;
  mode: TravelMode;
  departureTime?: string;
  arrivalTime?: string;
  avoid?: RouteAvoidance[];
};
```

Supported modes should be designed as an extensible enum:

```ts
type TravelMode =
  | "driving"
  | "walking"
  | "cycling"
  | "transit"
  | "two_wheeler";
```

The initial implementation may enable only the modes supported reliably by the selected routing provider.

### Route response

```ts
type RouteOption = {
  id: string;
  durationSeconds: number;
  distanceMeters: number;
  geometry: GeoJSON.LineString;
  summary?: string;
  warnings?: RouteWarning[];
  legs: RouteLeg[];
};
```

---

## 5.5 Route Comparison

The route-selection UI should compare options using:

- ETA
- Duration
- Distance
- Route differences
- Traffic/incident state where available
- Tolls where available
- Warnings

Do not overload the interface with low-value routing metadata.

---

## 5.6 Active Trip

An active trip is a first-class application state.

```ts
type ActiveTrip = {
  id: string;
  origin: Coordinate;
  destination: Destination;
  selectedRouteId: string;
  mode: TravelMode;
  startedAt: string;
  status: "active" | "paused" | "completed" | "cancelled";
  currentPosition?: Coordinate;
  etaSeconds?: number;
  remainingDistanceMeters?: number;
};
```

The active-trip state must survive:
- Page refresh
- Temporary network loss
- Background/foreground transitions where platform capabilities permit

---

## 5.7 Navigation

Navigation should support:

- Current position
- Route line
- Route progress
- Next maneuver
- Remaining distance
- ETA
- Re-routing
- Off-route detection
- Trip completion
- Important route warnings

### Off-route behavior

1. Detect meaningful deviation.
2. Avoid immediate repeated reroutes caused by GPS noise.
3. Request a new route.
4. Replace the active route atomically.
5. Update ETA and remaining distance.
6. Preserve trip identity.

---

## 5.8 Saved Places

Users can save destinations as:

- Home
- Work
- Favorite
- Custom label

```ts
type SavedPlace = {
  id: string;
  userId: string;
  label: string;
  placeId?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};
```

---

## 5.9 Recent Activity

Store recent:

- Searches
- Destinations
- Trips

Recent items should be bounded and automatically aged/removed according to product privacy rules.

---

## 5.10 Notifications

Notification architecture should support:

- Trip reminders
- Active-trip events
- Route changes
- Important travel alerts

Notifications must be opt-in where required and should avoid noisy, low-value updates.

---

# 6. UX / Design System Requirements

Wayve should use a modern, minimal interface with strong visual hierarchy.

## 6.1 Visual language

Recommended characteristics:

- Spacious layouts
- Large readable typography
- Rounded surfaces
- Subtle elevation
- High-contrast primary actions
- Restrained color palette
- Motion used for state changes, not decoration
- Map content visually separated from controls
- Compact information cards
- Bottom-sheet patterns on mobile

The design should prioritize **clarity over dashboard density**.

## 6.2 Responsive breakpoints

Suggested starting points:

```text
Mobile:  < 640px
Tablet:  640–1023px
Desktop: >= 1024px
Wide:    >= 1440px
```

These are implementation defaults, not rigid design constraints.

## 6.3 Accessibility

Target WCAG 2.2 AA where practical.

Requirements include:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Screen-reader labels
- Sufficient contrast
- Reduced-motion support
- Touch targets approximately 44×44 CSS px or larger
- No information conveyed by color alone

---

# 7. Technical Architecture

## 7.1 High-level architecture

```text
┌───────────────────────────────────────────────┐
│                  WAYVE CLIENT                 │
│                                               │
│  Home • Search • Map • Planner • Navigation  │
└──────────────────────┬────────────────────────┘
                       │ HTTPS
                       ▼
┌───────────────────────────────────────────────┐
│                    API LAYER                  │
│                                               │
│ Auth • Places • Search • Routes • Trips       │
└───────────────┬───────────────────┬───────────┘
                │                   │
                ▼                   ▼
      ┌─────────────────┐   ┌─────────────────┐
      │  Application DB │   │ Geo/Map Provider│
      │ PostgreSQL      │   │ Search / Route  │
      │ + PostGIS       │   └─────────────────┘
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │ Cache / Queue   │
      │ Redis           │
      └─────────────────┘
```

The first version should remain a **modular monolith** unless scale or team boundaries justify splitting services.

---

# 8. Recommended Stack

## Frontend

- **Next.js + React + TypeScript**
- Tailwind CSS or equivalent token-based styling system
- MapLibre GL JS for map rendering where compatible with selected tile provider
- TanStack Query for server state
- Zustand or React Context for small client-side state domains
- Zod for runtime validation

## Backend

- **TypeScript**
- Next.js server routes/BFF or a dedicated Node.js API
- Zod/OpenAPI contracts
- PostgreSQL
- PostGIS for geospatial queries
- Redis for caching and rate limiting

## Infrastructure

Provider-neutral architecture with:

- Managed PostgreSQL
- Managed Redis
- Object storage for user-generated assets if needed
- CDN
- HTTPS
- Centralized logging
- Error monitoring
- Metrics/tracing

The project should avoid hard-coding business logic into a single mapping vendor.

---

# 9. Repository Structure

Recommended monorepo:

```text
wayve/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── config/
│   ├── maps/
│   ├── routing/
│   └── validation/
├── db/
│   ├── migrations/
│   └── seeds/
├── docs/
├── tests/
├── .github/
│   └── workflows/
├── package.json
└── README.md
```

If a separate API is unnecessary initially, `apps/api` can be represented by the web application's server layer.

---

# 10. Data Model

## User

```text
users
- id UUID PK
- email
- display_name
- avatar_url
- created_at
- updated_at
```

## Saved Place

```text
saved_places
- id UUID PK
- user_id UUID FK
- label
- place_provider_id nullable
- latitude
- longitude
- metadata JSONB
- created_at
- updated_at
```

## Recent Search

```text
recent_searches
- id UUID PK
- user_id UUID FK
- query
- place_provider_id nullable
- latitude nullable
- longitude nullable
- created_at
```

## Trip

```text
trips
- id UUID PK
- user_id UUID nullable
- origin_latitude
- origin_longitude
- destination_latitude
- destination_longitude
- destination_label
- mode
- selected_route_id
- status
- started_at nullable
- completed_at nullable
- created_at
- updated_at
```

## Route Snapshot

```text
route_snapshots
- id UUID PK
- trip_id UUID FK
- provider
- provider_route_id nullable
- duration_seconds
- distance_meters
- geometry
- metadata JSONB
- created_at
```

Sensitive location history should not be retained indefinitely without a clear product reason and user-facing policy.

---

# 11. API Design

Base path:

```text
/api/v1
```

## Authentication

```http
POST /auth/session
DELETE /auth/session
GET /auth/me
```

Authentication implementation may use an established session/OAuth provider rather than custom password infrastructure.

## Search

```http
GET /search?q={query}&lat={lat}&lng={lng}
```

## Places

```http
GET /places/{id}
```

## Routes

```http
POST /routes
```

Request:

```json
{
  "origin": { "lat": 19.87, "lng": 75.34 },
  "destination": { "lat": 19.99, "lng": 73.78 },
  "mode": "driving"
}
```

## Trips

```http
POST /trips
GET /trips/{id}
PATCH /trips/{id}
POST /trips/{id}/complete
POST /trips/{id}/cancel
```

## Saved places

```http
GET /saved-places
POST /saved-places
PATCH /saved-places/{id}
DELETE /saved-places/{id}
```

---

# 12. External Provider Abstraction

Wayve should isolate third-party geospatial providers behind interfaces.

```ts
interface GeocodingProvider {
  search(query: string, context?: SearchContext): Promise<SearchResult[]>;
  getPlace(id: string): Promise<Place | null>;
}

interface RoutingProvider {
  route(request: RouteRequest): Promise<RouteOption[]>;
}
```

This allows future replacement or combination of providers without rewriting product logic.

---

# 13. State Management

Use three state categories.

### Server state
Managed with TanStack Query or equivalent:

- Search results
- Places
- Routes
- Trips
- Saved places

### Session state
- Authentication
- Current user
- Preferences

### Ephemeral UI state
- Open sheet
- Selected route
- Map viewport
- Search input
- Filters
- Modal state

Do not store server data redundantly in global client state unless there is a demonstrated need.

---

# 14. Caching Strategy

Cache aggressively for low-risk, repeatable reads.

### Suitable cache candidates
- Popular place metadata
- Search responses for short periods
- Route responses for short periods where provider terms allow
- Static configuration

### Do not cache blindly
- User-specific private data
- Highly dynamic navigation state
- Sensitive location data

Cache keys should include all meaningful routing/search parameters.

---

# 15. Geospatial Requirements

Use WGS84 coordinates.

```text
latitude:  -90 to +90
longitude: -180 to +180
```

PostGIS should be used for:

- Radius searches
- Nearby places
- Distance calculations
- Bounding-box queries
- Spatial indexes

Recommended indexes:

```sql
CREATE INDEX idx_saved_places_geom
ON saved_places
USING GIST (geom);
```

Coordinates received from clients must be validated before persistence or provider forwarding.

---

# 16. Location Handling

Location is permission-based.

States:

```text
unknown
requesting
granted
denied
unavailable
stale
```

The UI must remain usable if location permission is denied.

### Location quality

Track:

- Accuracy
- Timestamp
- Source
- Age

Ignore stale or obviously invalid readings for navigation decisions.

---

# 17. Security

## Required controls

- HTTPS everywhere
- Secure, HTTP-only session cookies where applicable
- CSRF protection where cookie authentication is used
- Input validation
- Output encoding
- Parameterized SQL
- Rate limiting
- Provider API keys kept server-side
- Secrets stored in environment/secret management systems
- Audit logs for sensitive account actions

## Privacy

Wayve should minimize storage of precise location data.

Users should be able to understand:

- Why location is requested
- Whether it is currently being used
- What trip/location data is stored
- How to remove saved data

---

# 18. API Reliability

Every API response should have predictable error semantics.

Example:

```json
{
  "error": {
    "code": "ROUTE_PROVIDER_UNAVAILABLE",
    "message": "Route service is temporarily unavailable.",
    "requestId": "req_123"
  }
}
```

Suggested error classes:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
RATE_LIMITED
PROVIDER_UNAVAILABLE
PROVIDER_TIMEOUT
CONFLICT
INTERNAL_ERROR
```

Do not expose provider secrets, stack traces, SQL errors, or internal infrastructure details to clients.

---

# 19. Performance Targets

These are engineering targets, not guarantees.

### Initial page
- Fast first contentful rendering on a normal mobile connection
- Avoid blocking the main UI on non-essential map resources

### Search
- Debounce client requests
- Target perceived response under ~500 ms for warm/cached requests

### Route planning
- Show a loading state immediately
- Target usable route results within a few seconds under normal provider conditions

### Map
- Avoid unnecessary full-map rerenders
- Cluster large point collections
- Lazy-load secondary layers

### Core Web Vitals
Target good CWV scores for primary screens.

---

# 20. Offline / Degraded Mode

The application should degrade gracefully.

At minimum:

- Preserve the last known destination
- Preserve the current active-trip UI state
- Show clear offline status
- Avoid destructive state changes while offline
- Retry recoverable requests
- Prevent duplicate trip creation

Future versions may support downloadable offline maps/routes.

---

# 21. Observability

Every request should carry a request/correlation ID.

Monitor:

- API latency
- Error rate
- Route-provider failures
- Search-provider failures
- Authentication failures
- Client crashes
- Web Vitals
- Route calculation success rate
- Navigation reroute frequency

Avoid logging raw precise location unless explicitly required and governed by privacy policy.

---

# 22. Testing Strategy

## Unit tests

Test:

- Validation schemas
- Route normalization
- Provider adapters
- Geospatial calculations
- State transitions
- Utility functions

## Integration tests

Test:

- API + database
- Authentication
- Search provider adapter
- Routing provider adapter
- Trip lifecycle

## E2E tests

Critical flows:

1. Open home
2. Search destination
3. Select destination
4. Request routes
5. Select route
6. Start trip
7. Simulate route deviation
8. Re-route
9. Complete trip
10. Save destination

## Visual regression

Protect:

- Home
- Search
- Route comparison
- Active trip
- Place detail
- Mobile bottom sheets
- Desktop map layout

---

# 23. Analytics

Analytics must measure product behavior without collecting unnecessary sensitive data.

Suggested events:

```text
app_opened
search_started
search_completed
place_viewed
route_requested
route_selected
trip_started
trip_rerouted
trip_completed
trip_cancelled
place_saved
place_unsaved
location_permission_granted
location_permission_denied
```

Do not send raw precise coordinates to analytics by default.

---

# 24. Feature Flags

Use feature flags for capabilities that may roll out progressively.

Examples:

```text
routing.transit
routing.cycling
routing.two_wheeler
places.photos
trip.notifications
offline.maps
new.home
```

Flags should have safe defaults and should be removable after rollout.

---

# 25. Environment Configuration

Example:

```text
NODE_ENV=
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=
MAP_TILE_PROVIDER=
MAP_TILE_TOKEN=
GEOCODING_PROVIDER=
GEOCODING_API_KEY=
ROUTING_PROVIDER=
ROUTING_API_KEY=
SENTRY_DSN=
ANALYTICS_KEY=
```

Never commit production secrets.

Provide `.env.example` with variable names and descriptions only.

---

# 26. CI/CD

Every pull request should run:

```text
lint
typecheck
unit tests
integration tests
build
```

Main branch should additionally run:

```text
E2E tests
security/dependency checks
deployment
```

Recommended environments:

```text
local
development
staging
production
```

Database migrations must be version-controlled and forward-compatible.

---

# 27. Deployment Architecture

Initial production:

```text
User
  │
  ▼
CDN / Edge
  │
  ▼
Web Application
  │
  ├──── API
  │      ├── PostgreSQL/PostGIS
  │      ├── Redis
  │      └── Geo Providers
  │
  └──── Static Assets
```

Scale independently only when metrics demonstrate a bottleneck.

---

# 28. Security & Abuse Controls

Implement:

- Request rate limits
- Search abuse protection
- Authentication brute-force protection
- Payload size limits
- Provider quota protection
- Bot mitigation where necessary
- Abuse monitoring

Provider requests should be centrally controlled so clients cannot directly manipulate private API credentials.

---

# 29. Accessibility & Internationalization

Architecture should be i18n-ready even if only one language launches.

Support eventually:

- Localized UI strings
- Localized distance/time formats
- RTL layouts
- Localized place names
- Locale-aware number formatting

Avoid embedding user-facing strings directly into business logic.

---

# 30. Data Retention

Default principle:

> Keep data only as long as it provides a clear product benefit or is required for legitimate operational/legal reasons.

Recommended starting policies:

- Recent searches: short-lived/bounded
- Active trips: retained for operational continuity
- Completed trip history: optional and user-controlled where feasible
- Saved places: retained until user removes them
- Logs: short retention with access controls
- Analytics: aggregated/anonymized where possible

Exact retention periods should be finalized alongside the privacy policy and applicable law.

---

# 31. MVP Definition

The MVP is complete when a user can:

- Open Wayve
- Search for a destination
- Select a place
- View the destination on a map
- Request a route
- Compare available routes
- Select a route
- Start a trip
- Track progress
- Handle a basic reroute
- Complete/cancel a trip
- Save a destination
- Return to recent/saved destinations

The MVP should **not** attempt to launch every possible mobility feature simultaneously.

---

# 32. Phase 2

Potential additions:

- Multi-stop trips
- Transit-specific routing
- Rich nearby discovery
- Better route explanations
- Trip history
- Notifications
- Sharing
- Collaborative trips
- Offline route support
- Personalized destinations
- Native mobile clients

---

# 33. Phase 3

Potential platform capabilities:

- Multimodal trip planning
- Real-time mobility availability
- Public-transit live data
- Parking
- EV charging
- Fleet/business accounts
- Advanced trip intelligence
- Integrations with external mobility providers

These should remain modular and provider-independent.

---

# 34. Key Architectural Decisions

### Decision 1 — Modular monolith first

**Reason:** faster development, simpler deployment, fewer distributed-system failure modes.

### Decision 2 — Provider abstraction

**Reason:** mapping/search/routing providers can change by geography, cost, quality, or licensing.

### Decision 3 — PostgreSQL + PostGIS

**Reason:** one reliable relational store can handle users, trips, saved places, and core geospatial queries.

### Decision 4 — Server-side provider credentials

**Reason:** protect API keys and centralize quotas, caching, and provider failover.

### Decision 5 — First-class trip state

**Reason:** navigation is a persistent workflow, not merely a screen.

---

# 35. Open Decisions

The following must be finalized before implementation lock:

- Exact map tile provider
- Geocoding/search provider
- Routing provider
- Transit data provider
- Authentication provider
- Cloud/deployment provider
- Analytics provider
- Error monitoring provider
- Final visual design tokens
- Supported launch geographies
- Supported travel modes at launch
- Location-data retention policy
- Legal/privacy requirements
- Whether Wayve requires native mobile apps at launch

---

# 36. Implementation Order

Recommended engineering sequence:

### Sprint 1 — Foundation
- Repository
- TypeScript configuration
- Design tokens
- UI primitives
- Database
- Authentication
- CI

### Sprint 2 — Maps + Search
- Map shell
- Location state
- Search API
- Search UI
- Place selection
- Provider adapter

### Sprint 3 — Routing
- Route API
- Route normalization
- Route comparison UI
- Route rendering
- Travel modes

### Sprint 4 — Trips
- Trip model
- Start/complete/cancel
- Active-trip state
- Progress UI
- Basic rerouting

### Sprint 5 — Personalization
- Saved places
- Recents
- User preferences
- Persistence

### Sprint 6 — Hardening
- Accessibility
- Error states
- Performance
- Offline/degraded behavior
- Security
- Observability
- E2E tests
- Production deployment

---

# 37. Definition of Done

A feature is considered production-ready when:

- UX matches approved design
- Responsive behavior is verified
- Accessibility requirements are met
- Loading/empty/error states exist
- API contracts are validated
- Unit/integration tests cover critical logic
- E2E coverage exists for critical user paths
- Logs and metrics exist for failure-prone operations
- No secrets are exposed
- Privacy implications are documented
- Performance is acceptable on mobile
- Feature flag/rollback strategy exists where appropriate
- Documentation is updated

---

# 38. Final Architecture Principle

Wayve should be built as a **mobility platform, not a collection of map screens**.

The central abstraction is the **trip**:

```text
Destination
    ↓
Search / Place
    ↓
Route Options
    ↓
Selected Route
    ↓
Active Trip
    ↓
Progress / Re-route
    ↓
Completed Trip
```

Every major feature should strengthen this lifecycle while keeping the interface visually simple.

The system should be deliberately modular so that maps, routing, discovery, saved places, notifications, and future mobility services can evolve independently without forcing a rewrite of the core product.
