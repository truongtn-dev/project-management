# Project Structure - Clean Architecture

```
project-management/
├── src/
│   ├── components/
│   │   ├── common/                 # Shared reusable components
│   │   │   ├── stat-card.jsx
│   │   │   ├── progress-bar.jsx
│   │   │   └── badge.jsx
│   │   ├── admin/                  # Admin-only components
│   │   │   ├── user-form.jsx
│   │   │   ├── user-card.jsx
│   │   │   └── permission-table.jsx
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── activity-feed.jsx
│   │   │   ├── priority-task-list.jsx
│   │   │   ├── task-donut-chart.jsx
│   │   │   └── project-bar-chart.jsx
│   │   ├── projects/               # Project management components
│   │   │   ├── project-card.jsx
│   │   │   ├── project-form.jsx
│   │   │   └── project-list.jsx
│   │   ├── tasks/                  # Task management components
│   │   │   ├── task-card.jsx
│   │   │   ├── task-form.jsx
│   │   │   └── task-detail.jsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── sidebar.jsx
│   │   │   ├── header.jsx
│   │   │   └── layout.jsx
│   │   └── protected-route.jsx
│   ├── pages/                      # Page components (lowercase)
│   │   ├── login.jsx
│   │   ├── dashboard.jsx
│   │   ├── gantt.jsx
│   │   ├── projects.jsx
│   │   ├── tasks.jsx
│   │   └── users.jsx
│   ├── styles/                     # All CSS files
│   │   ├── global.css             # Global styles & design system
│   │   ├── layout.css             # Layout styles
│   │   ├── auth.css               # Authentication pages
│   │   ├── dashboard.css
│   │   ├── projects.css
│   │   ├── tasks.css
│   │   └── users.css
│   ├── services/                   # Business logic & API calls
│   │   ├── firebase-services.js   # Firestore CRUD operations
│   │   └── auth-service.js        # Authentication logic
│   ├── hooks/                      # Custom React hooks
│   │   └── use-firebase.js
│   ├── contexts/                   # React contexts
│   │   └── auth-context.jsx
│   ├── utils/                      # Utility functions
│   │   ├── date-utils.js
│   │   └── validators.js
│   ├── config/                     # Configuration
│   │   └── firebase.js
│   ├── app.jsx                     # Main App component
│   └── main.jsx                    # Entry point
├── public/
├── package.json
└── vite.config.js
```

## Key Principles

### 1. Separation of Concerns
- **Components**: UI logic only
- **Services**: Data fetching & business logic
- **Hooks**: Reusable stateful logic
- **Utils**: Pure helper functions

### 2. Module Organization
- Each feature has its own folder in `components/`
- Admin-specific components isolated in `components/admin/`
- Common/shared components in `components/common/`

### 3. Naming Conventions
- **Files**: lowercase with hyphens (`user-card.jsx`)
- **Components**: PascalCase exports (`export default UserCard`)
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE

### 4. Data Flow
```
Firebase ← services ← hooks ← components/pages
```
- No mock data
- All data fetched from Firestore via services
- Real-time updates via onSnapshot listeners

### 5. CSS Organization
- All styles in `styles/` folder
- Global design system in `global.css`
- Feature-specific styles in dedicated files
- Import CSS in respective components

## Benefits
✅ **Maintainable**: Clear separation, easy to find files  
✅ **Scalable**: Add features without restructuring  
✅ **Clean Code**: Single responsibility principle  
✅ **Team-friendly**: New developers can navigate easily  
✅ **Production-ready**: Follows industry best practices
