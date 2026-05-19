# Security Specification - MedRoute Optimizer

## Data Invariants
1. A Scenario must be owned by the user who created it (`userId == request.auth.uid`).
2. Hospitals, Supplies, and Vehicles are system-provided and read-only for standard users.
3. Timestamps (`createdAt`, `updatedAt`) must be server-validated.

## The Dirty Dozen Payloads

### 1. Identity Spoofing (Scenario)
Attempt to create a scenario for another user.
```json
{
  "name": "Hack Plan",
  "userId": "other_user_id",
  "selectedHospitalIds": ["h1"],
  "selectedSupplyIds": ["s1"],
  "selectedVehicleId": "v1",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```
**Expected**: PERMISSION_DENIED

### 2. Orphaned Write (Scenario)
Attempt to create a scenario with a non-existent userId.
```json
{
  "name": "Orphan Plan",
  "userId": "non_existent",
  "selectedHospitalIds": ["h1"],
  "selectedSupplyIds": ["s1"],
  "selectedVehicleId": "v1",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```
**Expected**: PERMISSION_DENIED

### 3. Resource Poisoning (Scenario Name)
Extremely long name to exhaust resources.
```json
{
  "name": "A".repeat(2000),
  "userId": "my_uid",
  "selectedHospitalIds": [],
  "selectedSupplyIds": [],
  "selectedVehicleId": "v1",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```
**Expected**: PERMISSION_DENIED

### 4. Privilege Escalation (Hospital)
Standard user attempting to update a hospital's name.
```json
{
  "name": "Fake Hospital"
}
```
**Expected**: PERMISSION_DENIED

### 5. Type Poisoning (Supply Weight)
Providing a string for a numeric weight field.
```json
{
  "id": "s1",
  "name": "Test",
  "weight": "heavy",
  "value": 100,
  "type": "emergency"
}
```
**Expected**: PERMISSION_DENIED

### 6. Invalid Enum Value (Supply Type)
Providing a type not in the enum.
```json
{
  "id": "s1",
  "name": "Test",
  "weight": 10,
  "value": 100,
  "type": "illegal_type"
}
```
**Expected**: PERMISSION_DENIED

### 7. Global Read Leak (Scenarios)
Attempt to list scenarios without being signed in.
**Expected**: PERMISSION_DENIED

### 8. Cross-User Read (Scenario)
User A attempting to read User B's scenario.
**Expected**: PERMISSION_DENIED

### 9. Immutable Field Modification (Scenario userId)
Attempt to update the userId of an existing scenario.
```json
{
  "userId": "stolen_scenario_id"
}
```
**Expected**: PERMISSION_DENIED

### 10. Client-Side Timestamp Manipulation
Providing a past date for `updatedAt`.
```json
{
  "updatedAt": "1990-01-01T00:00:00Z"
}
```
**Expected**: PERMISSION_DENIED

### 11. Bypassing Validation (Empty Lists)
Scenario with no hospitals. (Actually empty list might be valid, but let's say it must have at least one if we enforce it)
Let's instead test "Ghost Field" injection.
```json
{
  "name": "Plan",
  "ghostField": "malicious_data"
}
```
**Expected**: PERMISSION_DENIED (via strict schema check)

### 12. Invalid ID Poisoning
Attempt to use a path traversal ID.
**Expected**: PERMISSION_DENIED (via isValidId)
