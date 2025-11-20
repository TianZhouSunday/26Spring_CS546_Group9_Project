# CS546 Patterns Used in This Project

This document outlines the CS546 patterns and conventions followed in this project, based on the course lectures.

## Project Structure

Following CS546 standard structure:
```
server/
├── app.js                 # Initializes and runs the server
├── package.json          # Must have "type": "module" and "start" script
├── config/               # Configuration files
│   ├── mongoConnection.js # Database connection (singleton pattern)
│   ├── mongoCollections.js # Collection accessors (async functions)
│   └── settings.js       # Environment variables
├── routes/               # All routing scripts
│   ├── index.js         # "Glues" all routes together (constructorMethod pattern)
│   ├── health.js
│   ├── test.js
│   └── users.js
├── data/                 # Database access modules (abstraction layer)
│   ├── users.js
│   ├── posts.js
│   └── helpers.js
└── middleware/           # Express middleware
    ├── logger.js
    └── errorHandler.js
```

## Error Handling Patterns

### In Data Modules (data/*.js)
- **Throw errors** using `throw` statement
- Can throw strings: `throw 'Error message'`
- Can throw Error objects: `throw new Error('Error message')`
- **DO NOT catch errors** in data modules (unless recoverable)
- Let errors bubble up to routes

### In Routes (routes/*.js)
- **Always use try/catch** around async operations
- Catch errors and return: `res.status(code).json({ error: message })`
- Use appropriate status codes:
  - 400: Bad request (validation errors)
  - 404: Not found
  - 500: Server errors

### Error Response Format
Always return: `{ error: "message" }`

Example:
```javascript
try {
  const result = await someFunction();
  res.json(result);
} catch (e) {
  res.status(400).json({ error: e.message || e.toString() });
}
```

## Route Patterns

### Basic Route Structure
```javascript
import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  try {
    // Your logic here
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
```

### Request Body Access
- **MUST** use `app.use(express.json())` in app.js
- Without this, `req.body` will be undefined!
- Access via: `const { field1, field2 } = req.body;`

### Response Methods
- `res.json(data)` - Send JSON response (status 200 by default)
- `res.status(code).json(data)` - Send JSON with specific status code
- `res.status(code).send()` - Send response with status code

## MongoDB Patterns

### Connection Pattern
- Use singleton pattern in `mongoConnection.js`
- Connection is established once and reused
- Export async function that returns database instance

### Collection Access Pattern
- Use `mongoCollections.js` to export async functions
- Each function returns a promise that resolves to a collection
- Pattern: `const collection = await collectionName();`

### Data Access Layer
- Abstract database queries in `data/` folder
- Each data module exports functions for CRUD operations
- Functions should:
  - Validate all inputs
  - Throw errors for invalid inputs
  - Return data (not raw MongoDB results)

## Async/Await Patterns

### Always use async/await
```javascript
router.post('/example', async (req, res) => {
  try {
    const result = await someAsyncFunction();
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
```

### MongoDB Operations
All MongoDB operations return promises, so use await:
```javascript
const collection = await posts();
const result = await collection.findOne({ _id: id });
```

## Validation Patterns

### Two Places for Validation
1. **Routes**: Check that data exists and is present
2. **Data Modules**: Full validation (type, bounds, format, etc.)

### Helper Functions
Use helper functions from `data/helpers.js`:
- `AvailableString(str, name)` - Validates strings
- `AvailableID(id, name)` - Validates MongoDB ObjectIds
- `AvailableObj(obj, name)` - Validates objects

## Module Patterns

### ES6 Modules Only
- Use `export` and `import` (NOT require/module.exports)
- Must have `"type": "module"` in package.json

### Export Patterns
```javascript
// Named exports
export const function1 = () => { };
export function function2() { }

// Default export
export default exportedObject;
```

### Import Patterns
```javascript
// Named imports
import { function1, function2 } from './module.js';

// Default import
import module from './module.js';
```

## Express Middleware

### Required Middleware
1. **express.json()** - Parse JSON request bodies (REQUIRED for POST/PUT/PATCH/DELETE)
2. **express.urlencoded()** - Parse form data
3. **CORS** - Allow cross-origin requests (for frontend)
4. **Error Handler** - Must be last middleware

### Middleware Order
```javascript
app.use(express.json());        // First: Parse bodies
app.use(cors());                 // CORS
app.use(logger);                 // Logging
constructorMethod(app);          // Routes
app.use(errorHandler);           // Last: Error handling
```

## Status Codes

Following CS546 conventions:
- **200**: Success (default for res.json())
- **400**: Bad request (validation errors, bad input)
- **404**: Not found (resource doesn't exist)
- **500**: Server error (unexpected errors)
- **503**: Service unavailable (database down, etc.)

## Testing Patterns

### Using Postman
- Set body type to "raw"
- Set type to "JSON"
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)

### Using curl
```bash
# GET request
curl http://localhost:3000/health

# POST request with JSON
curl -X POST http://localhost:3000/users/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass","email":"test@test.com"}'
```

## Key CS546 Principles

1. **Separation of Concerns**: Routes handle HTTP, data modules handle database
2. **Error Checking**: Every method checks inputs thoroughly
3. **Async/Await**: Use async/await, not callbacks
4. **Validation**: Validate in both routes and data modules
5. **Error Format**: Always return `{ error: "message" }`
6. **Module Design**: Modules should be "nuclear" - self-contained with full error checking

## References

- CS546 Lecture: Modules and Applications
- CS546 Lecture: MongoDB
- CS546 Lecture: API Development and Intermediate MongoDB
- CS546 Lecture: Async Programming
- CS546 Lecture: Fundamentals of Web Development


