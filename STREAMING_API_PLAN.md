# Streaming API Implementation Plan

**Date**: November 9, 2025  
**Goal**: Implement Server-Sent Events (SSE) streaming for plan generation  
**Benefits**: Natural timeout reset per chunk, progressive UI updates, better UX

---

## 🎯 Current Problems

1. **Timeout Issues**: 300s limit for entire generation
2. **UI Lag**: User sees nothing until plan is 100% complete
3. **Parse Errors**: Truncated JSON when response hits token limits
4. **Poor UX**: No progress indication during 3-5 minute waits

---

## ✅ Solution: Streaming API

### Architecture

```
Frontend                    Backend                      Gemini API
--------                    -------                      ----------
Submit form         →       Start streaming       →      generateContentStream()
                           
Show progress      ←        Chunk 1 received      ←      Chunk 1
"Analyzing..."             (Parse metadata)              
                           
Update progress    ←        Chunk 2 received      ←      Chunk 2
"Day 1 complete"           (Parse day data)
                           
Update progress    ←        Chunk 3 received      ←      Chunk 3
"Day 2 complete"           (Parse day data)
                           
Final plan         ←        Complete              ←      Final chunk
displayed                  (Save to DB)
```

### Implementation Steps

#### 1. Create Streaming API Endpoint

**File**: `app/api/lifeengine/generate-stream/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse input
        const body = await req.json();
        const input = inputSchema.parse(body);
        
        // Setup Gemini streaming
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-pro',
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 32768,
          },
        });
        
        // Send initial progress
        const sendProgress = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };
        
        sendProgress({ type: 'status', message: 'Starting generation...' });
        
        // Stream from Gemini
        const resultStream = await model.generateContentStream(fullPrompt);
        
        let accumulatedText = '';
        let chunkCount = 0;
        
        for await (const chunk of resultStream.stream) {
          chunkCount++;
          const chunkText = chunk.text();
          accumulatedText += chunkText;
          
          // Send progress update
          sendProgress({
            type: 'progress',
            chunk: chunkCount,
            length: accumulatedText.length,
            preview: accumulatedText.substring(0, 200),
          });
          
          // Try to parse and send day updates
          try {
            const partial = JSON.parse(accumulatedText);
            if (partial.days?.length) {
              sendProgress({
                type: 'day_complete',
                day: partial.days.length,
                total: input.duration.value,
              });
            }
          } catch {
            // Not parseable yet, continue
          }
        }
        
        // Parse final response
        const planJson = JSON.parse(accumulatedText);
        const verifiedPlan = verifyPlan(planJson, input);
        
        // Save to database
        const planId = await savePlan(verifiedPlan, input);
        
        // Send final result
        sendProgress({
          type: 'complete',
          planId,
          plan: verifiedPlan.plan,
        });
        
        controller.close();
        
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error.message,
          })}\n\n`)
        );
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### 2. Update Frontend to Use Streaming

**File**: `app/lifeengine/create/page.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setGenerating(true);
  setProgress({ stage: 'Starting...', percent: 0 });
  
  try {
    const response = await fetch('/api/lifeengine/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        const data = JSON.parse(line.slice(6));
        
        switch (data.type) {
          case 'status':
            setProgress({ stage: data.message, percent: 5 });
            break;
            
          case 'progress':
            setProgress({
              stage: `Processing chunk ${data.chunk}...`,
              percent: Math.min(90, 10 + (data.chunk * 5)),
            });
            break;
            
          case 'day_complete':
            setProgress({
              stage: `Day ${data.day}/${data.total} complete`,
              percent: Math.floor((data.day / data.total) * 90) + 5,
            });
            break;
            
          case 'complete':
            setProgress({ stage: 'Complete!', percent: 100 });
            setPlan(data.plan);
            router.push(`/lifeengine/plan/${data.planId}`);
            break;
            
          case 'error':
            setError(data.message);
            break;
        }
      }
    }
  } catch (error: any) {
    setError(error.message);
  } finally {
    setGenerating(false);
  }
};
```

#### 3. Add Progress UI Component

```tsx
{generating && (
  <Card>
    <div className="p-8 text-center">
      <div className="animate-spin text-6xl mb-4">⏳</div>
      <h3 className="text-xl font-bold mb-2">{progress.stage}</h3>
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="text-gray-600">{progress.percent}% complete</p>
    </div>
  </Card>
)}
```

---

## 📊 Benefits

### 1. No More Timeouts
- **Before**: 300s timeout for entire generation
- **After**: Timeout resets on each chunk (every 5-10s)
- **Result**: Can generate 30+ day plans without issues

### 2. Better UX
- **Before**: 3-5 minute wait with no feedback
- **After**: Real-time progress updates
  * "Starting generation..."
  * "Day 1/7 complete (14%)"
  * "Day 2/7 complete (28%)"
  * etc.

### 3. Faster Perceived Performance
- **Before**: Wait 3 min → See full plan
- **After**: See progress immediately → Feels faster even if same duration

### 4. Graceful Error Handling
- **Before**: Fail at 298s with no partial data
- **After**: Save partial data if interrupted, show what was generated

---

## 🚀 Migration Strategy

### Phase 1: Add Streaming Endpoint (Non-Breaking)
- Create `/api/lifeengine/generate-stream` alongside existing
- Keep existing `/api/lifeengine/generate` for compatibility
- Test streaming with new plans

### Phase 2: Update Create Plan Page
- Add feature flag to toggle streaming
- Default to streaming for new plans
- Fallback to old endpoint if streaming fails

### Phase 3: Gradual Rollout
- Monitor error rates
- Collect user feedback
- Fix issues

### Phase 4: Full Migration
- Update Custom GPT page to use streaming
- Deprecate old endpoint
- Remove feature flag

---

## 🔧 Technical Considerations

### Token Limits
- Streaming doesn't change token limits
- Still need dynamic allocation based on plan duration
- But partial responses are usable even if truncated

### Caching
- Can't use 24h caching with streaming (need fresh data)
- But streaming is fast enough that caching is less critical

### Error Recovery
- Save partial plans if generation interrupted
- Allow users to "continue" from last saved day
- Better than losing all progress

---

## 📝 Implementation Priority

1. **HIGH**: Create streaming endpoint
2. **HIGH**: Update Create Plan page
3. **MEDIUM**: Add progress UI component
4. **MEDIUM**: Update Custom GPT page
5. **LOW**: Add error recovery for partial plans

---

**Status**: Ready to implement! 🚀
**Next Step**: Create `/api/lifeengine/generate-stream/route.ts`
