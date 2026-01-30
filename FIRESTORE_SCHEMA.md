# Firestore Collections Schema

## 📋 users (Updated with Team Member Fields)

```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // Email address (required)
  displayName: string,            // Full name (required)
  role: string,                   // Role/Position (required)
  phone: string,                  // Phone number (new field)
  expertise: string,              // Main expertise/specialization (new field)
  photoURL: string | null,        // Profile picture URL
  createdAt: string | Timestamp   // Account creation date
}
```

### Role Examples:
- **C-Level**: CEO, CTO, CCO, CMO, CPO, CLO
- **Standard**: Admin, Quản lý, Nhân viên

### Example Data:
```javascript
{
  uid: "abc123",
  email: "truongntce180140@fpt.edu.vn",
  displayName: "Nguyễn Thành Trương",
  role: "CEO",
  phone: "0973898830",
  expertise: "Quản lý chung, Pitching, Tech Support",
  photoURL: null,
  createdAt: "2025-01-28T12:00:00.000Z"
}
```

---

## 📁 projects

```javascript
{
  name: string,                   // Project name
  description: string,            // Project description
  status: string,                 // "Chưa bắt đầu" | "Đang thực hiện" | "Hoàn thành" | "Tạm dừng" | "Hủy bỏ"
  startDate: Timestamp,           // Start date
  endDate: Timestamp,             // End date
  progress: number,               // 0-100
  managerName: string,            // Project manager name
  managerId: string,              // Manager user ID
  memberCount: number,            // Number of team members
  members: string[],              // Array of member UIDs
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## ✅ tasks

```javascript
{
  name: string,                   // Task title
  description: string,            // Task description
  status: string,                 // "Chưa bắt đầu" | "Đang thực hiện" | "Hoàn thành" | "Tạm dừng"
  priority: string,               // "Thấp" | "Trung bình" | "Cao"
  progress: number,               // 0-100
  projectId: string,              // Reference to project
  assignedTo: string,             // User UID
  assignedToName: string,         // User display name
  dueDate: Timestamp,             // Deadline
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 📢 activities

```javascript
{
  title: string,                  // Activity title
  description: string,            // Activity description
  user: string,                   // User who performed action
  userId: string,                 // User UID
  type: string,                   // "project" | "task" | "user" | "system"
  relatedId: string,              // Related entity ID
  createdAt: Timestamp
}
```

---

## 💬 messages (Optional - for Chat feature)

```javascript
{
  projectId: string,              // Project reference
  userId: string,                 // Sender UID
  userName: string,               // Sender name
  message: string,                // Message content
  attachments: string[],          // File URLs
  createdAt: Timestamp
}
```

---

## 🔥 Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read users
      allow read: if request.auth != null;
      
      // Only the user themselves or Admin can update
      allow update: if request.auth.uid == userId 
                    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
      
      // Only Admin can create/delete users
      allow create, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'Quản lý']);
      allow update, delete: if request.auth != null 
                          && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'Quản lý']
                             || resource.data.managerId == request.auth.uid);
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null 
                    && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'Quản lý']
                       || resource.data.assignedTo == request.auth.uid);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'Quản lý'];
    }
    
    // Activities collection
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
  }
}
```

---

## 📝 Notes

- **phone field**: Hỗ trợ multiple numbers separated by " - " (e.g., "0786868628 - 0865242249")
- **expertise field**: Text field cho phép multiple expertises separated by commas
- **role field**: Không giới hạn, có thể custom (CEO, CTO, Admin, etc.)
- **Timestamps**: Sử dụng `serverTimestamp()` khi create/update

---

## 🎯 Team Members Example Data

```javascript
// Sample data for testing
const teamMembers = [
  {
    displayName: "Nguyễn Thành Trương",
    role: "CEO",
    expertise: "Quản lý chung, Pitching, Tech Support",
    phone: "0973898830",
    email: "truongntce180140@fpt.edu.vn"
  },
  {
    displayName: "Nguyễn Đức Thắng",
    role: "CTO",
    expertise: "Dev Lead, System Architect",
    phone: "0944737100",
    email: "thangndce180608@fpt.edu.vn"
  },
  // Add more members...
];
```
