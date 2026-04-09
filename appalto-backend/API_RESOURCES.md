# API Resources Guide

## Overview
API Resources provide a transformation layer between your models and the JSON responses sent to clients. They ensure consistent, clean response formatting across all API endpoints.

## Created Resources

### UserResource
**File**: [app/Http/Resources/UserResource.php](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Http/Resources/UserResource.php)

**Features**:
- Conditional contractor fields (only shown for contractor role)
- ISO 8601 date formatting
- Excludes sensitive data (password, tokens)

**Usage Example**:
```php
use App\Http\Resources\UserResource;

// Single user
return new UserResource($user);

// Collection
return UserResource::collection($users);
```

---

### TenderResource
**File**: [app/Http/Resources/TenderResource.php](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Http/Resources/TenderResource.php)

**Features**:
- Automatically includes BOQ items if loaded via Eloquent relationships
- Shows bids count if available
- Award information only shown for awarded tenders
- Proper float casting for budget

**Usage Example**:
```php
use App\Http\Resources\TenderResource;

// With BOQ items
$tender = Tender::with('boqItems')->find($id);
return new TenderResource($tender);

// Response format
{
  "id": 1,
  "title": "Tender Title",
  "budget": 150000.00,
  "boqItems": [...]
}
```

---

### BoqItemResource
**File**: [app/Http/Resources/BoqItemResource.php](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Http/Resources/BoqItemResource.php)

**Features**:
- Float casting for quantity
- Boolean casting for is_optional
- All BOQ item fields included

---

### BidResource
**File**: [app/Http/Resources/BidResource.php](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Http/Resources/BidResource.php)

**Features**:
- Includes contractor details if loaded
- Includes tender details if loaded
- Includes bid items collection if loaded
- Supports additional fields from database joins
- Float casting for total_amount

**Usage Example**:
```php
use App\Http\Resources\BidResource;

// With relationships
$bid = Bid::with(['contractor', 'tender', 'bidItems'])->find($id);
return new BidResource($bid);
```

---

### BidItemResource
**File**: [app/Http/Resources/BidItemResource.php](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Http/Resources/BidItemResource.php)

**Features**:
- Includes BOQ item details if loaded
- Float casting for prices

---

## How to Use in Controllers

### Basic Usage
```php
use App\Http\Resources\TenderResource;

public function show($id)
{
    $tender = Tender::findOrFail($id);
    return new TenderResource($tender);
}
```

### With Collections
```php
use App\Http\Resources\TenderResource;

public function index()
{
    $tenders = Tender::all();
    return TenderResource::collection($tenders);
}
```

### With Relationships (Eager Loading)
```php
use App\Http\Resources\TenderResource;

public function show($id)
{
    $tender = Tender::with('boqItems')->findOrFail($id);
    return new TenderResource($tender);
}
```

### Custom Response Wrapper
```php
return TenderResource::collection($tenders)
    ->additional([
        'meta' => [
            'total' => $tenders->count()
        ]
    ]);
```

---

## Benefits

✅ **Consistency**: All API responses follow the same structure  
✅ **Maintainability**: Change format in one place  
✅ **Security**: Hide sensitive fields easily  
✅ **Type Safety**: Explicit type casting prevents bugs  
✅ **Conditional Fields**: Show different data based on context  
✅ **Relationship Control**: Include related data when needed  

---

## Next Steps

To fully integrate these resources into your controllers:

1. **Update AuthController** to use `UserResource`
2. **Update TenderController** to use `TenderResource` and `BoqItemResource`
3. **Update BidController** to use `BidResource` and `BidItemResource`

This will replace the manual array formatting currently used in controllers.
