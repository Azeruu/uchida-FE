# Routing Structure

## 📁 Folder Structure
```
src/
├── routes/
│   ├── AppRouter.jsx      # Main router component
│   ├── HomePage.jsx       # Home page (base path)
│   ├── TestPage.jsx       # Test page (/test)
│   └── README.md          # This file
├── Login.jsx              # Login component
├── adminDb.jsx           # Admin dashboard
├── App.jsx               # Original test component (now unused)
└── main.jsx              # Entry point
```

## 🛣️ Route Mapping

| Path | Component | Description | Access |
|------|-----------|-------------|---------|
| `/` | `HomePage` | Landing page with navigation options | Public |
| `/test` | `TestPage` | Test interface for participants | Guest |
| `/admin` | `Login` or `AdminDashboard` | Admin login or dashboard | Admin only |

## 🔄 Navigation Flow

### Base Path (`/`)
- **HomePage**: Shows welcome screen with two options
  - "Mulai Test sebagai Guest" → `/test`
  - "Login Admin" → `/admin`

### Test Path (`/test`)
- **TestPage**: Complete test interface
  - Guest access (no login required)
  - Navigation: Back to menu, Admin
  - Full test functionality

### Admin Path (`/admin`)
- **Login**: If not authenticated
  - Email: admin.kim@gmail.com
  - Password: kimkantor1
- **AdminDashboard**: If authenticated
  - Full admin functionality
  - Navigation: Back to menu, Test

## 🚀 Features

### HomePage
- Clean landing page
- Two main action buttons
- Admin credentials display

### TestPage
- Complete test functionality
- Guest access
- Navigation to other pages
- All original test features

### AppRouter
- Centralized routing logic
- Session management
- Route change detection
- Navigation helpers

## 📝 Usage

1. **Start at base path**: `http://localhost:5173/`
2. **Choose access type**: Guest test or Admin login
3. **Navigate between pages**: Using navigation buttons
4. **Session persistence**: Admin login persists across navigation

## 🔧 Technical Details

- **Route Detection**: Uses `window.location.pathname`
- **Navigation**: Programmatic with `window.history.pushState`
- **Session**: Backend session management
- **State Management**: React hooks for user state
- **Error Handling**: Graceful fallbacks and loading states
