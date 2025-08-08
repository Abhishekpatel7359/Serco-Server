# Optimized Node.js API Server

## Features

### ✅ Optimizations Implemented

1. **Pagination Support**
   - Added to all routes (CRUD, Devices, Ping, Scheduler)
   - Configurable page size with limits (1-100 items per page)
   - Metadata includes total count, current page, total pages, etc.

2. **Direct Ping Cron Job**
   - Removed API dependency for scheduled ping operations
   - Direct ping execution using the `ping` library
   - Improved performance and reliability

3. **Rate Limiting**
   - General rate limiting: 100 requests per 15 minutes
   - Strict rate limiting: 20 requests per 15 minutes (sensitive operations)
   - Ping rate limiting: 10 requests per minute

4. **Input Validation**
   - IP address format validation
   - Pagination parameter validation
   - Request body validation

5. **Standardized Response Format**
   - Consistent success/error response structure
   - Proper HTTP status codes
   - Timestamp inclusion

6. **Database Optimizations**
   - Increased connection pool size
   - Added connection error handling
   - Automatic reconnection
   - Query optimization with proper indexing support

7. **Cleanup Jobs**
   - Automatic cleanup of old completed tasks (30+ days)
   - Runs daily at midnight

## API Usage Examples

### Pagination Parameters

All endpoints now support pagination:

```json
{
  "page": 1,
  "limit": 10,
  "orderBy": "created_at",
  "sortDirection": "DESC"
}
```

### CRUD Operations with Pagination

```json
{
  "ENCDATA": "encrypted_data_containing",
  "queryType": "select",
  "table": "users",
  "conditions": {},
  "page": 1,
  "limit": 20,
  "orderBy": "id",
  "sortDirection": "ASC"
}
```

### Batch Ping with Pagination

```json
{
  "ips": ["192.168.1.1", "192.168.1.2", "..."],
  "numPings": 4,
  "page": 1,
  "limit": 50
}
```

### Device Routes with Pagination

```
GET /api/Devices/AV?page=1&limit=25
GET /api/Devices/PDU?page=2&limit=10
```

### Scheduler Tasks with Pagination

```
GET /api/scheduler/tasks?page=1&limit=20&status=SCHEDULED
```

## Response Format

All responses now follow a standardized format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalPages": 5,
    "totalCount": 50,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Performance Improvements

1. **Database Connection Pool**: Increased from 10 to 20 connections
2. **Direct Ping Operations**: Eliminated API overhead in cron jobs
3. **Rate Limiting**: Prevents abuse and ensures fair usage
4. **Input Validation**: Reduces invalid requests processing
5. **Cleanup Jobs**: Maintains database performance by removing old data

## Security Enhancements

1. **Rate Limiting**: Prevents brute force and DoS attacks
2. **Input Validation**: Prevents injection attacks
3. **Error Handling**: Doesn't expose sensitive information
4. **Standardized Responses**: Consistent error messaging

## Installation

```bash
npm install express-rate-limit
```

## Environment Variables

Make sure your `.env` file includes:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=your_database
ENCRYPTION_KEY=your_encryption_key
IV=your_iv
```

## Running the Server

```bash
node index.js
```

The server will start on port 3500 with all optimizations enabled.