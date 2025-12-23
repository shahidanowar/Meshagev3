# MESHAGE - Controlled Flooding Protocol with TTL

## Visual Explanation of Message Propagation

### Scenario: 10 Devices in Linear Chain

```
Network Topology:
A ←→ B ←→ C ←→ D ←→ E ←→ F ←→ G ←→ H ←→ I ←→ J

Configuration: MAX_HOPS = 5
```

### Message Flow Timeline

**User on Device A sends: "Hello World"**

```
═══════════════════════════════════════════════════════════════
TIME: T=0ms
═══════════════════════════════════════════════════════════════

Device A (Sender):
┌─────────────────────────────────────────────────────┐
│ 1. User types "Hello World"                        │
│ 2. Format: "A|||Alice|||0|||Hello World"           │
│                         ↑                           │
│                    Hop Count = 0                    │
│ 3. Mark as seen: hash("A:Hello World")             │
│ 4. Send → Device B                                 │
└─────────────────────────────────────────────────────┘

Network State:
[A*]←→[B ]←→[C ]←→[D ]←→[E ]←→[F ]←→[G ]←→[H ]←→[I ]←→[J ]
 ↑ Sender

═══════════════════════════════════════════════════════════════
TIME: T=10ms - HOP 1
═══════════════════════════════════════════════════════════════

Device B receives:
┌─────────────────────────────────────────────────────┐
│ Received: "A|||Alice|||0|||Hello World"            │
│ 1. Parse: hopCount = 0                             │
│ 2. Check: hash not seen ✓                          │
│ 3. Check: 0 < MAX_HOPS(5) ✓                        │
│ 4. Display: "Alice: Hello World"                   │
│ 5. Increment: newHop = 1                           │
│ 6. Forward: "A|||Alice|||1|||Hello World" → C      │
└─────────────────────────────────────────────────────┘

Network State:
[A*]←→[B*]←→[C ]←→[D ]←→[E ]←→[F ]←→[G ]←→[H ]←→[I ]←→[J ]
       ↑ Received at hop 1

═══════════════════════════════════════════════════════════════
TIME: T=20ms - HOP 2
═══════════════════════════════════════════════════════════════

Device C receives:
┌─────────────────────────────────────────────────────┐
│ Received: "A|||Alice|||1|||Hello World"            │
│ 1. Parse: hopCount = 1                             │
│ 2. Check: hash not seen ✓                          │
│ 3. Check: 1 < MAX_HOPS(5) ✓                        │
│ 4. Display: "Alice: Hello World"                   │
│ 5. Increment: newHop = 2                           │
│ 6. Forward: "A|||Alice|||2|||Hello World" → D      │
└─────────────────────────────────────────────────────┘

Network State:
[A*]←→[B*]←→[C*]←→[D ]←→[E ]←→[F ]←→[G ]←→[H ]←→[I ]←→[J ]
              ↑ Received at hop 2

═══════════════════════════════════════════════════════════════
TIME: T=30ms - HOP 3
═══════════════════════════════════════════════════════════════

Device D receives:
┌─────────────────────────────────────────────────────┐
│ Received: "A|||Alice|||2|||Hello World"            │
│ 1. Parse: hopCount = 2                             │
│ 2. Check: hash not seen ✓                          │
│ 3. Check: 2 < MAX_HOPS(5) ✓                        │
│ 4. Display: "Alice: Hello World"                   │
│ 5. Increment: newHop = 3                           │
│ 6. Forward: "A|||Alice|||3|||Hello World" → E      │
└─────────────────────────────────────────────────────┘

Network State:
[A*]←→[B*]←→[C*]←→[D*]←→[E ]←→[F ]←→[G ]←→[H ]←→[I ]←→[J ]
                   ↑ Received at hop 3

═══════════════════════════════════════════════════════════════
TIME: T=40ms - HOP 4
═══════════════════════════════════════════════════════════════

Device E receives:
┌─────────────────────────────────────────────────────┐
│ Received: "A|||Alice|||3|||Hello World"            │
│ 1. Parse: hopCount = 3                             │
│ 2. Check: hash not seen ✓                          │
│ 3. Check: 3 < MAX_HOPS(5) ✓                        │
│ 4. Display: "Alice: Hello World"                   │
│ 5. Increment: newHop = 4                           │
│ 6. Forward: "A|||Alice|||4|||Hello World" → F      │
└─────────────────────────────────────────────────────┘

Network State:
[A*]←→[B*]←→[C*]←→[D*]←→[E*]←→[F ]←→[G ]←→[H ]←→[I ]←→[J ]
                        ↑ Received at hop 4

═══════════════════════════════════════════════════════════════
TIME: T=50ms - HOP 5 (LAST HOP)
═══════════════════════════════════════════════════════════════

Device F receives:
┌─────────────────────────────────────────────────────┐
│ Received: "A|||Alice|||4|||Hello World"            │
│ 1. Parse: hopCount = 4                             │
│ 2. Check: hash not seen ✓                          │
│ 3. Check: 4 < MAX_HOPS(5) ✓                        │
│ 4. Display: "Alice: Hello World"                   │
│ 5. Increment: newHop = 5                           │
│ 6. Forward: "A|||Alice|||5|||Hello World" → G      │
└─────────────────────────────────────────────────────┘

Network State:
[A*]←→[B*]←→[C*]←→[D*]←→[E*]←→[F*]←→[G ]←→[H ]←→[I ]←→[J ]
                             ↑ Received at hop 5

═══════════════════════════════════════════════════════════════
TIME: T=60ms - TTL LIMIT REACHED! 🛑
═══════════════════════════════════════════════════════════════

Device G receives:
┌─────────────────────────────────────────────────────┐
│ Received: "A|||Alice|||5|||Hello World"            │
│ 1. Parse: hopCount = 5                             │
│ 2. Check: hash not seen ✓                          │
│ 3. Check: 5 < MAX_HOPS(5) ✗ FAILED!               │
│    ⚠️  TTL LIMIT REACHED                           │
│ 4. Display: "Alice: Hello World"                   │
│ 5. ❌ DO NOT FORWARD                               │
│    Log: "Message reached max hops (5>=5)"          │
└─────────────────────────────────────────────────────┘

Network State:
[A*]←→[B*]←→[C*]←→[D*]←→[E*]←→[F*]←→[G*]←→[H ]←→[I ]←→[J ]
                                  ↑ Received but NOT forwarded
                                    Devices H,I,J will NOT receive

═══════════════════════════════════════════════════════════════
FINAL RESULT
═══════════════════════════════════════════════════════════════

Devices that received message:
✅ Device A (Hop 0 - Sender)
✅ Device B (Hop 1)
✅ Device C (Hop 2)
✅ Device D (Hop 3)
✅ Device E (Hop 4)
✅ Device F (Hop 5)
✅ Device G (Hop 5 - Last recipient)

Devices that DID NOT receive:
❌ Device H (Would be hop 6 - beyond MAX_HOPS)
❌ Device I (Would be hop 7 - beyond MAX_HOPS)
❌ Device J (Would be hop 8 - beyond MAX_HOPS)

Statistics:
- Total Devices: 10
- Devices Reached: 7 (70%)
- Messages Sent: 6 (A→B, B→C, C→D, D→E, E→F, F→G)
- Hops Achieved: 5 (MAX_HOPS setting)

```

## Mesh Network Example (More Realistic)

```
Network Topology:
        C ←→ D
        ↑    ↑
    A ←→ B ←→ E ←→ F
        ↓    ↓
        G ←→ H

Configuration: MAX_HOPS = 5
```

**User on Device A sends: "Meeting at 5pm"**

```
═════════════════════════════════════════════════════
HOP 0: Device A (Sender)
═════════════════════════════════════════════════════
Sends to: B, G (2 direct connections)
Message: "A|||Alice|||0|||Meeting at 5pm"

        [C] [D]
           
    [A*]→[B] [E] [F]
       ↓
        [G] [H]

═════════════════════════════════════════════════════
HOP 1: Devices B, G receive
═════════════════════════════════════════════════════
B forwards to: A(ignore), C, E, G
G forwards to: A(ignore), B(ignore), H

New message: "A|||Alice|||1|||Meeting at 5pm"

        [C]←[D]
         ↑   
    [A*]←[B*]→[E] [F]
         ↓    ↓
        [G*]→[H]

═════════════════════════════════════════════════════
HOP 2: Devices C, E, H receive
═════════════════════════════════════════════════════
C forwards to: B(ignore), D
E forwards to: B(ignore), D, F, H(ignore)
H forwards to: B(ignore), E(ignore), G(ignore)

New message: "A|||Alice|||2|||Meeting at 5pm"

        [C*]→[D]
         ↑    ↑
    [A*] [B*] [E*]→[F]
              ↓
        [G*] [H*]

═════════════════════════════════════════════════════
HOP 3: Devices D, F receive
═════════════════════════════════════════════════════
D forwards to: C(ignore), E(ignore)
F forwards to: E(ignore)

New message: "A|||Alice|||3|||Meeting at 5pm"

        [C*] [D*]
              ↑
    [A*] [B*] [E*] [F*]
              
        [G*] [H*]

═════════════════════════════════════════════════════
FINAL: All 8 devices received the message!
═════════════════════════════════════════════════════

Coverage: 100% (8/8 devices)
Total Hops: 3 (well within MAX_HOPS=5)
Efficiency: Excellent for mesh topology
```

## Key Observations

### Why TTL is Important:

1. **Linear Topology** (worst case):
   - Messages travel hop-by-hop
   - MAX_HOPS=5 reaches 5-7 devices in chain
   
2. **Mesh Topology** (best case):
   - Multiple paths to destinations
   - MAX_HOPS=5 easily covers 15-20 devices
   - Most devices reached in 2-3 hops

### Without TTL:

```
Linear chain of 100 devices without TTL:
❌ Message would forward 100 times
❌ Total transmission count: ~100
❌ Network congestion: SEVERE
❌ Battery drain: EXTREME
```

### With TTL=5:

```
Linear chain of 100 devices with TTL=5:
✅ Message forwards only 5 times
✅ Total transmission count: 5
✅ Coverage: First 6 devices (reasonable)
✅ Network efficiency: EXCELLENT
```

## Testing Recommendation

**Test 1: Chain Test (6 devices)**
- Arrange in line: A—B—C—D—E—F—G
- Send from A
- Expected: F receives, G does not

**Test 2: Mesh Test (5+ devices)**
- Form natural mesh (multiple connections)
- Send from any device
- Expected: All devices within 5 hops receive

**Test 3: TTL Modification Test**
```kotlin
// Try with MAX_HOPS = 3
private const val MAX_HOPS = 3

// Then test again - should reach fewer devices
```

