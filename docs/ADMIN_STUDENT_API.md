# Admin Student Management API

This document describes the API endpoints for managing students from the admin panel.

## Base URL
```
/api/admin/students
```

## Authentication
All endpoints require admin authentication and appropriate permissions (currently commented out for testing).

## Endpoints

### 1. Get All Students
**GET** `/api/admin/students`

Retrieve a paginated list of all students with filtering and search capabilities.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status: active, inactive, suspended, pending
- `emailVerified` (optional) - Filter by email verification: true, false
- `authProvider` (optional) - Filter by auth provider: local, google, facebook
- `search` (optional) - Search in name, email, phone, customId
- `sortField` (optional) - Sort by field (default: createdAt)
- `sortOrder` (optional) - Sort order: asc, desc (default: desc)

**Example Request:**
```
GET /api/admin/students?page=1&limit=10&status=active&search=john
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "64f5a2b8c9e1234567890abc",
        "customId": "STU0001",
        "name": "John Doe",
        "emailId": "john@example.com",
        "phone": "+1234567890",
        "image": "https://example.com/image.jpg",
        "status": "active",
        "emailVerified": true,
        "authProvider": "local",
        "currentRole": "Student",
        "createdAt": "2023-09-04T10:15:30.000Z",
        "updatedAt": "2023-09-04T10:15:30.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "totalPages": 15
    }
  }
}
```

### 2. Get Student Statistics
**GET** `/api/admin/students/stats`

Get comprehensive statistics about students for the admin dashboard.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 1500,
      "activeStudents": 1200,
      "inactiveStudents": 100,
      "suspendedStudents": 50,
      "pendingStudents": 150,
      "verifiedEmails": 1300,
      "unverifiedEmails": 200
    },
    "statusBreakdown": [
      { "_id": "active", "count": 1200 },
      { "_id": "pending", "count": 150 },
      { "_id": "inactive", "count": 100 },
      { "_id": "suspended", "count": 50 }
    ],
    "authProviderBreakdown": [
      { "_id": "local", "count": 1000 },
      { "_id": "google", "count": 400 },
      { "_id": "facebook", "count": 100 }
    ],
    "recentRegistrations": [
      { "_id": "2023-09-01", "count": 25 },
      { "_id": "2023-09-02", "count": 30 },
      { "_id": "2023-09-03", "count": 28 }
    ]
  }
}
```

### 3. Get Student Details
**GET** `/api/admin/students/:id`

Get detailed information about a specific student.

**Path Parameters:**
- `id` - Student MongoDB ObjectId

**Example Request:**
```
GET /api/admin/students/64f5a2b8c9e1234567890abc
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "64f5a2b8c9e1234567890abc",
      "customId": "STU0001",
      "name": "John Doe",
      "emailId": "john@example.com",
      "phone": "+1234567890",
      "alternatePhone": "+0987654321",
      "image": "https://example.com/image.jpg",
      "bio": "Aspiring software developer",
      "currentRole": "Student",
      "profileVisibility": true,
      "contactMethod": "email",
      "emailVerified": true,
      "authProvider": "local",
      "status": "active",
      "skills": ["JavaScript", "React", "Node.js"],
      "portfolioLinks": ["https://github.com/johndoe"],
      "education": [...],
      "experience": [...],
      "courses": [...],
      "jobApplications": [...],
      "certificates": [...],
      "addresses": [...],
      "notificationSettings": {...},
      "settings": {...},
      "createdAt": "2023-09-04T10:15:30.000Z",
      "updatedAt": "2023-09-04T10:15:30.000Z"
    }
  }
}
```

### 4. Update Student Information
**PATCH** `/api/admin/students/:id`

Update student information. Supports file upload for profile image.

**Path Parameters:**
- `id` - Student MongoDB ObjectId

**Body Parameters (form-data):**
- `name` (optional) - Student name
- `emailId` (optional) - Student email
- `phone` (optional) - Primary phone number
- `alternatePhone` (optional) - Alternate phone number
- `bio` (optional) - Student bio
- `currentRole` (optional) - Current role/position
- `profileVisibility` (optional) - Profile visibility (boolean)
- `contactMethod` (optional) - Preferred contact method
- `emailVerified` (optional) - Email verification status (boolean)
- `status` (optional) - Student status
- `skills` (optional) - Array of skills
- `portfolioLinks` (optional) - Array of portfolio links
- `image` (optional) - Profile image file

**Example Request:**
```javascript
const formData = new FormData();
formData.append('name', 'John Smith');
formData.append('emailVerified', 'true');
formData.append('status', 'active');
formData.append('image', fileInput.files[0]);

fetch('/api/admin/students/64f5a2b8c9e1234567890abc', {
  method: 'PATCH',
  body: formData
});
```

**Example Response:**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "student": {
      // Updated student object
    }
  }
}
```

### 5. Update Student Status
**PATCH** `/api/admin/students/:id/status`

Update only the student's status.

**Path Parameters:**
- `id` - Student MongoDB ObjectId

**Body Parameters:**
- `status` (required) - New status: active, inactive, suspended, pending

**Example Request:**
```json
{
  "status": "suspended"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Student status updated to suspended",
  "data": {
    "student": {
      // Updated student object
    }
  }
}
```

### 6. Delete Student (Soft Delete)
**DELETE** `/api/admin/students/:id`

Soft delete a student by setting their status to inactive.

**Path Parameters:**
- `id` - Student MongoDB ObjectId

**Example Response:**
```json
{
  "success": true,
  "message": "Student deactivated successfully",
  "data": {
    "student": {
      // Deactivated student object
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad Request (invalid data, validation errors)
- `404` - Not Found (student not found)
- `500` - Internal Server Error

## Notes

1. **Authentication**: All routes currently have authentication middleware commented out for testing purposes. Uncomment the `protect` and `authorize` middleware in production.

2. **File Upload**: The update student endpoint supports image upload. The file should be sent as multipart/form-data with the field name `image`.

3. **Validation**: All endpoints include proper validation for MongoDB ObjectIds and required fields.

4. **Pagination**: The get all students endpoint supports pagination with default values of page=1 and limit=10.

5. **Search**: The search functionality looks through name, email, phone, and customId fields with case-insensitive matching.

6. **Filtering**: Multiple filters can be applied simultaneously for more specific queries.

## Frontend Integration Example

Here's an example of how to integrate these endpoints in a React admin panel:

```javascript
// Get all students
const getStudents = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/admin/students?${params}`);
  return response.json();
};

// Update student status
const updateStudentStatus = async (studentId, status) => {
  const response = await fetch(`/api/admin/students/${studentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  return response.json();
};

// Get student details
const getStudentDetails = async (studentId) => {
  const response = await fetch(`/api/admin/students/${studentId}`);
  return response.json();
};
```
