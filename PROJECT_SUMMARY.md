# Real Estate Panel - Semester Project

A Next.js frontend application for managing real estate properties, requests, and meetings.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** - UI components
- **React Hook Form + Yup** - Form validation
- **TanStack Query** - Data fetching and caching
- **Zustand** - Auth state management
- **Axios** - HTTP client

## Features Implemented

### Phase 0: Setup ✓
- Next.js project initialization
- shadcn/ui components setup
- TanStack Query provider
- Zustand auth store
- Axios instance with interceptors

### Phase 1: Authentication ✓
- Login page with validation
- Register page with validation
- Token persistence in localStorage
- Protected route wrapper
- Role-based navigation (USER/ADMIN)

### Phase 2: Properties ✓
- Properties list page
- Property detail page with images
- Query caching and invalidation

### Phase 3: My Properties CRUD ✓
- Create property form
- Edit property form
- Delete property (ACTIVE only)
- Owner/Admin permission checks

### Phase 4: Image Management ✓
- Upload images to properties
- Delete images from properties
- Hover-to-delete UI
- Owner/Admin permissions

### Phase 5: Requests ✓
- Create BUY/RENT requests from property detail
- My Requests list page
- Request detail view
- Status badges (PENDING/APPROVED/REJECTED)

### Phase 6: Meetings ✓
- My Meetings list page
- Meeting detail view
- Role badges (BUYER/SELLER)
- Google Maps integration

### Phase 7: Admin Panel ✓
- Admin requests page (PENDING only)
- Approve modal with datetime + lat/lng
- Reject modal with optional reason
- Query invalidation on approval/rejection

### Phase 8: Polish ✓
- Loading spinner component
- Global error handling (401/403/404/409)
- Toast notifications throughout
- Query cache invalidation
- Better loading states

## Running the Application

### Prerequisites
- Node.js 18+
- Backend API running on http://localhost:3001

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:3000 (or the port shown in terminal)

### Build

```bash
npm run build
npm start
```

## API Endpoints Used

All endpoints communicate with `http://localhost:3001`

**Auth:**
- POST /auth/register
- POST /auth/login
- GET /auth/me

**Properties:**
- GET /properties
- GET /properties/:id
- POST /properties
- PATCH /properties/:id
- DELETE /properties/:id

**Images:**
- POST /properties/:id/images
- DELETE /properties/:id/images/:imageId

**Requests:**
- POST /properties/:id/requests
- GET /me/requests
- GET /requests/:id

**Admin:**
- GET /admin/requests?status=PENDING
- POST /admin/requests/:id/approve
- POST /admin/requests/:id/reject

**Meetings:**
- GET /me/meetings
- GET /meetings/:id

## Project Structure

```
app/
├── login/              # Login page
├── register/           # Register page
├── properties/         # Properties list & detail
│   └── [id]/
│       ├── page.tsx    # Property detail with images
│       └── edit/       # Edit property form
├── my-properties/      # User's properties CRUD
│   └── create/         # Create property form
├── my-requests/        # User's requests list
├── requests/[id]/      # Request detail
├── my-meetings/        # User's meetings list
├── meetings/[id]/      # Meeting detail
└── admin/
    └── requests/       # Admin pending requests

components/
├── auth/
│   └── protected-route.tsx    # Route protection
├── providers/
│   ├── query-provider.tsx     # TanStack Query
│   └── auth-provider.tsx      # Auth initialization
├── ui/                        # shadcn components
└── navbar.tsx                 # Main navigation

lib/
└── axios.ts                   # Axios instance + interceptors

store/
└── auth.ts                    # Zustand auth store
```

## User Roles

**USER:**
- Browse all properties
- Create/edit/delete own properties
- Upload/delete images on own properties
- Create BUY/RENT requests
- View own requests and meetings

**ADMIN:**
- Browse all properties
- Edit any property
- Approve/reject pending requests
- Create meetings with coordinates

## Notes

- No tests or documentation were created per requirements
- JWT token stored in localStorage
- All mutations invalidate relevant queries
- 401 errors clear auth and redirect to login
- Role-based UI rendering in navbar
