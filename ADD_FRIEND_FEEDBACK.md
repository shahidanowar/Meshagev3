# Friend Request Visual Feedback - Disappearing Issue Fix

## 🐛 **The Bug**

**Problem:** When clicking "Add Friend", the "Request Sent" status shows instantly but then disappears immediately.

**Why it happened:** The cleanup useEffect was triggered on EVERY `friendRequests` change, which happened right after clicking "Add Friend". This cleared the `pendingClicks` state before it could be properly synced with storage.

---

## ✅ **The Fix**

Changed the cleanup useEffect dependency from `[visible, friendRequests]` to just `[visible]`.

### **Before (Broken):**

```typescript
useEffect(() => {
    if (visible) {
        // Clear pending clicks...
    }
}, [visible, friendRequests]);  // ← Triggers on friendRequests changes!
```

**Problem Flow:**
```
1. Click "Add Friend"
   → pendingClicks.add(deviceId)  ✓
   → Shows "Request Sent"  ✓

2. Parent saves to storage (50ms later)
   → friendRequests updates

3. useEffect triggers (because friendRequests changed!)  ← BUG!
   → Checks: Does deviceId have matching request?
   → Maybe checks too early, before request is saved
   → Clears pendingClicks  ❌
   → "Request Sent" disappears!  ❌
```

### **After (Fixed):**

```typescript
useEffect(() => {
    if (visible) {
        // Small delay to ensure friendRequests state has updated
        const timer = setTimeout(() => {
            setPendingClicks(prev => {
                const newSet = new Set<string>();
                prev.forEach(deviceId => {
                    // Keep in pending only if there's a matching outgoing request
                    const hasRequest = friendRequests.some(
                        req => req.persistentId === deviceId && req.type === 'outgoing'
                    );
                    if (hasRequest) {
                        newSet.add(deviceId);
                    }
                });
                return newSet;
            });
        }, 100); // Small delay to let state settle
        
        return () => clearTimeout(timer);
    }
}, [visible]); // ← Only triggers when modal opens/closes!
```

**Fixed Flow:**
```
1. Click "Add Friend"
   → pendingClicks.add(deviceId)  ✓
   → Shows "Request Sent"  ✓

2. Parent saves to storage (50ms later)
   → friendRequests updates

3. useEffect does NOT trigger (only depends on 'visible')  ✓
   → "Request Sent" stays visible!  ✓

4. Later, when modal reopens:
   → useEffect triggers (visible changed to true)
   → Cleans up any cancelled/removed requests
```

---

## 🔧 **Key Changes**

### **1. Removed `friendRequests` from dependency array**

**Before:**
```typescript
}, [visible, friendRequests]);  // Runs on EVERY friendRequest change
```

**After:**
```typescript
}, [visible]);  // Runs ONLY when modal opens/closes
```

### **2. Added 100ms delay**

**Why?**
- Ensures `friendRequests` state has fully updated before cleanup runs
- Only matters when modal opens, so no UX impact
- Prevents race conditions

```typescript
const timer = setTimeout(() => {
    // Cleanup logic...
}, 100);

return () => clearTimeout(timer);
```

---

## 📊 **Two useEffect Hooks Explained**

### **useEffect #1: Immediate Cleanup (When Request Saved)**

```typescript
useEffect(() => {
    friendRequests.forEach(req => {
        if (req.type === 'outgoing' && pendingClicks.has(req.persistentId)) {
            setPendingClicks(prev => {
                const newSet = new Set(prev);
                newSet.delete(req.persistentId);  // Remove from local state
                return newSet;
            });
        }
    });
}, [friendRequests, pendingClicks]);
```

**Purpose:** When a friend request is successfully saved to storage, remove it from the local `pendingClicks` state.

**When it runs:** Every time `friendRequests` changes

**Why it's safe:** Only removes items that EXIST in friendRequests (confirmed saved)

---

### **useEffect #2: Stale State Cleanup (When Modal Reopens)**

```typescript
useEffect(() => {
    if (visible) {
        const timer = setTimeout(() => {
            setPendingClicks(prev => {
                const newSet = new Set<string>();
                prev.forEach(deviceId => {
                    const hasRequest = friendRequests.some(...);
                    if (hasRequest) {
                        newSet.add(deviceId);  // Keep it
                    }
                    // If no request, don't add (clears cancelled requests)
                });
                return newSet;
            });
        }, 100);
        return () => clearTimeout(timer);
    }
}, [visible]);  // ← ONLY when modal visibility changes!
```

**Purpose:** When modal reopens, clean up any `pendingClicks` that don't have matching friend requests (cancelled/removed requests).

**When it runs:** ONLY when `visible` changes (modal opens/closes)

**Why it's safe now:** Doesn't interfere with normal "Add Friend" flow

---

## ✅ **Expected Behavior Now**

### **Scenario 1: Send Friend Request**
```
1. Click "Add Friend"
   → Shows "Request Sent" instantly  ✓

2. Wait (friendRequests updates in background)
   → "Request Sent" stays visible  ✓

3. Close and reopen modal
   → STILL shows "Request Sent"  ✓
   (Cleanup runs but finds matching request, keeps it)
```

### **Scenario 2: Cancel Friend Request**
```
1. You have pending request to Alice
   → Shows "Request Sent"  ✓

2. Cancel the request (from friend requests overlay)
   → friendRequests.remove(alice)

3. Close and reopen modal
   → Cleanup runs at 100ms delay
   → Checks: Alice in friendRequests? NO
   → Clears Alice from pendingClicks
   → Shows "Add Friend" again  ✓
```

### **Scenario 3: Remove Friend**
```
1. You and Bob are friends
   → Shows "Friend" (orange chat icon)  ✓

2. Unfriend Bob
   → Bob removed from friends list

3. Open Nearby Devices modal
   → Cleanup runs
   → Bob not in friendRequests
   → Shows "Add Friend"  ✓
```

---

## 🧪 **Testing**

### **Test 1: Visual Feedback Persists**
1. Click "Add Friend" on Alice
2. ✅ Should show "Request Sent" (green checkmark)
3. Wait 2 seconds
4. ✅ Should STILL show "Request Sent" (not disappear!)

### **Test 2: State After Modal Reopen**
1. Send request to Bob
2. Close modal
3. Reopen modal immediately
4. ✅ Should show "Request Sent"

### **Test 3: Cancelled Request Cleanup**
1. Send request to Charlie
2. Cancel request
3. Reopen modal
4. ✅ Should show "Add Friend" (request cleared)

---

## 📝 **Files Modified**

✅ `src/screens/Chats/NearbyDevicesModal.tsx`
- Changed cleanup useEffect dependency: `[visible, friendRequests]` → `[visible]`
- Added 100ms setTimeout for cleanup to ensure state has settled
- Added cleanup return function for timeout

---

## 💡 **Key Insight**

**The Problem:** Having `friendRequests` in the dependency array caused the cleanup to run immediately after adding a friend request, before it could be properly displayed.

**The Solution:** Only run cleanup when the modal actually opens/closes, not on every state change. Use a small delay to ensure state has settled.

**Result:** Immediate visual feedback that persists until the request is accepted/rejected or cancelled!

---

**The disappearing "Request Sent" bug is now fixed!** 🎉
