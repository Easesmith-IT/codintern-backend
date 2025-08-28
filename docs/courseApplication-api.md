# CourseApplication API Documentation

## Overview
The CourseApplication API provides endpoints to manage course applications submitted by students. It includes functionality for creating, reading, updating, and deleting course applications with proper validation and error handling.

## Base URLs
- **Student endpoints**: `/api/student/course-applications`
- **Admin endpoints**: `/api/admin/course-applications`

## Authentication
Most endpoints require authentication and proper role-based access. Make sure to:
- Include authentication middleware where needed
- Set appropriate user roles (Student, Admin, Instructor)
- Update the commented code in controllers to use `req.user` from auth middleware

## Endpoints

### POST Endpoints

#### 1. Create Course Application
**Endpoint**: `POST /api/student/course-applications/` or `POST /api/admin/course-applications/`

Creates a new course application.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "email": "john.doe@example.com",
  "education": "Bachelor's in Computer Science",
  "graduationYear": 2023,
  "course": "64a7b1c8d123456789abcdef", // Course ObjectId
  "student": "64a7b1c8d123456789abcdef" // Optional, Student ObjectId
}
```

**Response**:
```json
{
  "success": true,
  "message": "Course application submitted successfully",
  "application": { /* CourseApplication object */ }
}
```

#### 2. Bulk Update Application Status
**Endpoint**: `POST /api/admin/course-applications/bulk-update-status`

Updates multiple applications' status at once (Admin only).

**Request Body**:
```json
{
  "applicationIds": ["id1", "id2", "id3"],
  "status": "accepted",
  "remark": "Bulk approved after review",
  "updatedBy": "64a7b1c8d123456789abcdef",
  "updatedByModel": "Admin"
}
```

### GET Endpoints

#### 3. Get All Course Applications
**Endpoint**: `GET /api/admin/course-applications/`

Retrieves all course applications with filtering, pagination, and search.

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 10, max: 100): Items per page
- `status` (string): Filter by status (pending, reviewed, accepted, rejected)
- `course` (string): Filter by course ID
- `search` (string): Search by name, email, or education
- `sortBy` (string, default: appliedAt): Sort field
- `sortOrder` (string, default: desc): Sort order (asc, desc)

**Example**: `GET /api/admin/course-applications/?status=pending&page=1&limit=20&search=john`

#### 4. Get Application Statistics
**Endpoint**: `GET /api/admin/course-applications/stats`

Returns statistics about applications.

**Query Parameters**:
- `course` (string): Filter by course ID
- `dateFrom` (date): Filter from date
- `dateTo` (date): Filter to date

**Response**:
```json
{
  "success": true,
  "stats": {
    "pending": 15,
    "reviewed": 8,
    "accepted": 12,
    "rejected": 5,
    "total": 40
  }
}
```

#### 5. Get Applications by Course
**Endpoint**: `GET /api/admin/course-applications/course/:courseId`

Retrieves all applications for a specific course.

#### 6. Get Applications by Student
**Endpoint**: `GET /api/student/course-applications/student/:studentId`

Retrieves all applications submitted by a specific student.

#### 7. Get Application by ID
**Endpoint**: `GET /api/admin/course-applications/:id`

Retrieves a specific course application with full details including notes and status history.

### PATCH Endpoints

#### 8. Update Course Application
**Endpoint**: `PATCH /api/admin/course-applications/:id`

Updates application details.

**Request Body** (all fields optional):
```json
{
  "status": "reviewed",
  "notes": {
    "remark": "Application looks good, proceeding to next stage",
    "addedBy": "64a7b1c8d123456789abcdef",
    "addedByModel": "Admin"
  }
}
```

#### 9. Update Application Status
**Endpoint**: `PATCH /api/admin/course-applications/:id/status`

Specifically updates application status with history tracking.

**Request Body**:
```json
{
  "status": "accepted",
  "remark": "Congratulations! You've been accepted.",
  "updatedBy": "64a7b1c8d123456789abcdef",
  "updatedByModel": "Admin"
}
```

#### 10. Add Note to Application
**Endpoint**: `PATCH /api/admin/course-applications/:id/note`

Adds a note to the application.

**Request Body**:
```json
{
  "remark": "Student has relevant experience in React",
  "addedBy": "64a7b1c8d123456789abcdef",
  "addedByModel": "Instructor"
}
```

### DELETE Endpoints

#### 11. Delete Course Application
**Endpoint**: `DELETE /api/admin/course-applications/:id`

Deletes (soft delete by default) a course application.

**Query Parameters**:
- `deleteType` (string, default: soft): Type of deletion (soft, hard)

**Example**: `DELETE /api/admin/course-applications/123?deleteType=soft`

## Status Values
- `pending`: Initial status when application is submitted
- `reviewed`: Application has been reviewed by admin/instructor
- `accepted`: Application has been accepted
- `rejected`: Application has been rejected

## Error Handling
All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation errors)
- `404`: Resource not found
- `500`: Internal server error

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Data Models

### CourseApplication Schema
```javascript
{
  student: ObjectId, // Reference to Student
  firstName: String, // Required
  lastName: String, // Required
  phone: String, // Required
  email: String, // Required
  education: String, // Required
  graduationYear: Number, // Required
  course: ObjectId, // Required, Reference to Course
  status: String, // enum: pending, reviewed, accepted, rejected
  notes: [{ // Array of notes from admin/instructor
    remark: String,
    addedBy: ObjectId,
    addedByModel: String, // Admin or Instructor
    createdAt: Date
  }],
  statusHistory: [{ // Track status changes
    status: String,
    changedBy: ObjectId,
    changedByModel: String,
    changedAt: Date
  }],
  appliedAt: Date, // Auto-set on creation
  createdAt: Date, // Auto-set
  updatedAt: Date // Auto-updated
}
```

## Implementation Notes

1. **Authentication**: Update controllers to use authentication middleware and get user info from `req.user`.

2. **Authorization**: Add role-based access control:
   - Students can only create applications and view their own applications
   - Admins and Instructors can view, update, and manage all applications

3. **Validation**: All endpoints use Joi validation schemas to ensure data integrity.

4. **Duplicate Prevention**: The service layer prevents duplicate applications for the same course by the same student/email.

5. **History Tracking**: Status changes and notes are tracked with timestamps and user information.

6. **Soft Delete**: Applications are archived (soft deleted) by default to maintain data integrity.

## Example Usage

### Student applying for a course:
```javascript
POST /api/student/course-applications/
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "email": "jane.smith@email.com",
  "education": "B.Tech Computer Science",
  "graduationYear": 2024,
  "course": "64a7b1c8d123456789abcdef"
}
```

### Admin reviewing applications:
```javascript
GET /api/admin/course-applications/?status=pending&course=64a7b1c8d123456789abcdef

PATCH /api/admin/course-applications/64a7b1c8d123456789abcdef/status
{
  "status": "accepted",
  "remark": "Great background, welcome to the course!",
  "updatedBy": "64a7b1c8d123456789admin1",
  "updatedByModel": "Admin"
}
```
