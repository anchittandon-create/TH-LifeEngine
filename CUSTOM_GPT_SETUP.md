# Custom GPT Integration Guide for TH_LifeEngine

## Overview
This guide helps you set up the **TH_LifeEngine Companion** Custom GPT that generates personalized wellness plans without using OpenAI API in your app. The Custom GPT (hosted in ChatGPT) calls your public API endpoints, and your app stores and displays the plans.

---

## Part 1: Create Your Custom GPT in ChatGPT

### 1. Access GPT Builder
- Go to [ChatGPT](https://chatgpt.com)
- Click on your profile → "My GPTs" → "Create a GPT"

### 2. Configure Basic Settings

#### Name
```
TH_LifeEngine Companion
```

#### Description
```
Generates safe, personalized Yoga, Diet, Combined, and Holistic wellness plans from a structured user profile with strict JSON Structured Output for app ingestion.
```

#### Capabilities
- ❌ Web Browsing: OFF
- ❌ Code Interpreter: OFF  
- ❌ Image Generation: OFF

---

### 3. System Prompt (Instructions)

Copy and paste this entire prompt into the **Instructions** field:

```
You are TH_LifeEngine Companion, a certified-coach style planner that converts a structured user profile into safe, personalized plans.

Core contract:
- Always return a single JSON object that matches the Structured Output schema. Do not include prose unless the user explicitly asks for a preview, in which case append a concise Markdown preview AFTER the JSON.
- If critical fields are missing (age, goal, plan_type, stress_level, sleep_hours, diet_type), ask exactly 1–3 focused follow-ups, then produce a best-effort plan.
- Respect `language`; default English.

Planning logic:
- Personalize by goal, age, gender, preferred_time, activity_level, work_schedule, sleep_hours, stress_level, chronic_conditions (e.g., PCOS), mental_state, has_equipment, diet_type.
- Include rest/recovery logic at least 1 day/week; scale intensity to sleep and stress.
- Yoga: provide warmup/cooldown, 4–8 poses with durations, breathwork, focus_area, and a journaling prompt. Offer safe modifications. Prefer evening flows if preferred_time == "evening".
- Diet: 3 meals + snacks + evening tea (if applicable), simple portion guidance, swaps for dietary preferences (e.g., vegetarian). Encourage hydration.
- Combined: blend yoga + diet daily; time-of-day alignment (e.g., calming flows in evening, lighter dinners).
- Holistic: include yoga/diet/mindfulness/affirmations/sleep hygiene/rest-day logic.
- Category tagging: choose from ["Mindful Beginner","Detox Challenger","Spine Strengthener","Stress Soother","Metabolic Balancer","Core Builder"] based on goal and constraints.

Safety:
- Avoid extreme diets, unsafe poses, or medical claims. If very low sleep (<5h) or stress "high"/"very high", or significant conditions, add a gentle `disclaimer` recommending consulting a medical professional.
- Adapt PCOS-friendly guidance: low-GI, high-fiber, balanced meals; avoid absolutist rules; emphasize sustainability. Avoid contraindicated intense breath retentions.

Output discipline:
- Use simple language in `motivation` and `summary`.
- Keep `sequence` durations realistic for daily adherence (20–40 min unless user profile suggests more).
- If the user asks to "preview in Markdown", provide a short human-readable outline AFTER the JSON.

Addendum for Actions:
- If a profile_id is provided or present in a fetched profile, include `metadata.profile_id` in the output JSON.
- When available, call GET /api/v1/profiles/{id} to fetch a saved profile before plan generation; then POST the generated plan to /api/v1/plans.
```

---

### 4. Conversation Starters

Add these 3 conversation starters:

1. `Generate a combined 7-day plan for a vegetarian with evening workouts and high stress.`
2. `Create a diet-only week for PCOS with office-friendly lunches.`
3. `Build a holistic plan in Hindi for back pain and low motivation.`

---

### 5. Enable Structured Output

Click **"Enable Structured Output"** and paste this JSON Schema:

```json
{
  "type": "object",
  "title": "LifeEnginePlanResponse",
  "required": ["summary","weekly_schedule","recovery_tips","hydration_goals","metadata"],
  "properties": {
    "motivation": { "type": "string" },
    "category_tag": {
      "type": "string",
      "enum": ["Mindful Beginner","Detox Challenger","Spine Strengthener","Stress Soother","Metabolic Balancer","Core Builder"]
    },
    "summary": { "type": "string" },
    "weekly_schedule": {
      "type": "object",
      "description": "7-day plan using keys like monday..sunday",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "yoga": {
            "type": "object",
            "properties": {
              "warmup_min": { "type": "integer", "minimum": 0 },
              "sequence": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name","duration_min"],
                  "properties": {
                    "name": { "type": "string" },
                    "duration_min": { "type": "integer", "minimum": 1 },
                    "focus": { "type": "string" },
                    "modifications": { "type": "string" }
                  }
                }
              },
              "breathwork": { "type": "string" },
              "cooldown_min": { "type": "integer", "minimum": 0 },
              "journal_prompt": { "type": "string" },
              "focus_area": { "type": "string" }
            },
            "additionalProperties": false
          },
          "diet": {
            "type": "object",
            "properties": {
              "breakfast": { "type": "object", "properties": { "title": { "type":"string" }, "notes": { "type":"string" }, "portion_guidance": { "type":"string" }, "swap": { "type":"string" } }, "required": ["title"] },
              "lunch":     { "type": "object", "properties": { "title": { "type":"string" }, "notes": { "type":"string" }, "portion_guidance": { "type":"string" }, "swap": { "type":"string" } }, "required": ["title"] },
              "snacks":    { "type": "array",  "items": { "type":"object", "properties": { "title": { "type":"string" }, "notes": { "type":"string" }, "portion_guidance": { "type":"string" }, "swap": { "type":"string" } }, "required": ["title"] } },
              "dinner":    { "type": "object", "properties": { "title": { "type":"string" }, "notes": { "type":"string" }, "portion_guidance": { "type":"string" }, "swap": { "type":"string" } }, "required": ["title"] },
              "evening_tea": { "type": "object", "properties": { "title": { "type":"string" }, "notes": { "type":"string" } } }
            },
            "additionalProperties": false
          },
          "holistic": {
            "type": "object",
            "properties": {
              "mindfulness": { "type": "string" },
              "affirmation": { "type": "string" },
              "sleep": { "type": "string" },
              "rest_day": { "type": "boolean" }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      }
    },
    "recovery_tips": { "type": "array", "items": { "type":"string" }, "minItems": 1 },
    "hydration_goals": { "type": "string" },
    "metadata": {
      "type": "object",
      "required": ["generated_by","plan_type","language","timestamp"],
      "properties": {
        "generated_by": { "type": "string", "enum": ["gpt"] },
        "plan_type": { "type":"array", "items": { "type":"string", "enum": ["yoga","diet","combined","holistic"] }, "minItems": 1 },
        "language": { "type":"string" },
        "timestamp": { "type":"string", "description":"ISO 8601" },
        "profile_id": { "type":"string" }
      },
      "additionalProperties": false
    },
    "disclaimer": { "type": "string" }
  },
  "additionalProperties": false
}
```

---

### 6. Configure Actions (API Integration)

Click **"Create new action"** and paste this OpenAPI schema:

```yaml
openapi: 3.1.0
info:
  title: TH_LifeEngine Actions
  version: "1.0.0"
servers:
  - url: https://your-deployment-url.vercel.app
    description: Production API (UPDATE THIS URL!)
paths:
  /api/v1/profiles/{id}:
    get:
      operationId: getProfile
      summary: Get a saved user profile
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Profile" }
        "404":
          description: Not Found
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Error" }
  /api/v1/plans:
    post:
      operationId: postPlan
      summary: Store a generated plan
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/Plan" }
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema: { $ref: "#/components/schemas/PlanPostResponse" }
        "400":
          description: Bad Request
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Error" }
        "401":
          description: Unauthorized
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Error" }
  /api/v1/plans/latest:
    get:
      operationId: getLatestPlan
      summary: Get latest plan by profile_id
      parameters:
        - in: query
          name: profile_id
          required: true
          schema: { type: string }
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Plan" }
        "404":
          description: Not Found
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Error" }
components:
  schemas:
    Profile:
      type: object
      additionalProperties: false
      properties:
        name: { type: string }
        age: { type: integer }
        gender: { type: string, enum: [male, female, other] }
        location: { type: string }
        goal: { type: string }
        plan_type:
          type: array
          items: { type: string, enum: [yoga, diet, combined, holistic] }
        preferred_time: { type: string }
        diet_type: { type: string }
        activity_level: { type: string }
        work_schedule: { type: string }
        sleep_hours: { type: number }
        stress_level: { type: string }
        chronic_conditions:
          type: array
          items: { type: string }
        mental_state: { type: string }
        has_equipment: { type: boolean }
        language: { type: string }
        profile_id: { type: string }
      required: ["name","age","goal","plan_type","diet_type","sleep_hours","stress_level","language"]
    Plan:
      type: object
      additionalProperties: false
      properties:
        motivation: { type: string }
        category_tag:
          type: string
          enum: [Mindful Beginner, Detox Challenger, Spine Strengthener, Stress Soother, Metabolic Balancer, Core Builder]
        summary: { type: string }
        weekly_schedule:
          type: object
          description: "7-day schedule; keys like monday, tuesday, ..."
          additionalProperties: true
        recovery_tips:
          type: array
          items: { type: string }
        hydration_goals: { type: string }
        metadata:
          type: object
          additionalProperties: false
          properties:
            generated_by: { type: string, enum: [gpt] }
            plan_type:
              type: array
              items: { type: string, enum: [yoga, diet, combined, holistic] }
              minItems: 1
            language: { type: string }
            timestamp: { type: string, description: "ISO 8601 datetime" }
            profile_id: { type: string }
          required: [generated_by, plan_type, language, timestamp]
        disclaimer: { type: string }
      required: [summary, weekly_schedule, recovery_tips, hydration_goals, metadata]
    PlanPostResponse:
      type: object
      additionalProperties: false
      properties:
        ok: { type: boolean }
        plan_id: { type: string }
      required: [ok, plan_id]
    Error:
      type: object
      additionalProperties: false
      properties:
        error: { type: string }
      required: [error]
```

**⚠️ IMPORTANT:** Replace `https://your-deployment-url.vercel.app` with your actual deployment URL!

#### Authentication
- For development/testing: **None**
- For production: Consider using **API Key** authentication

---

### 7. Privacy Policy (REQUIRED for Actions)

You need a public privacy policy URL. Options:

#### Quick Option: Create a simple page
Create a file at `app/privacy/page.tsx` with this content:

```tsx
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">TH_LifeEngine Privacy Policy</h1>
      <p><strong>Effective Date:</strong> November 1, 2025</p>
      
      <section>
        <h2 className="text-2xl font-semibold">Who We Are</h2>
        <p>TH_LifeEngine processes personal data for wellness plan generation via Custom GPT and APIs.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">What We Collect</h2>
        <p>Profile inputs (name, age, gender, goals, health data), generated plans, and technical logs for reliability.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">How We Use Data</h2>
        <p>Generate personalized plans, store for review/analytics, maintain service security.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Data Sharing</h2>
        <p>No sale of data. Limited sharing with infrastructure providers under protection obligations.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Your Rights</h2>
        <p>Access, correction, deletion, portability. Contact: your-email@example.com</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Security</h2>
        <p>Encryption in transit, access controls, audit logging.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Retention</h2>
        <p>Up to 24 months unless deletion requested earlier.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Children</h2>
        <p>Not for under-13. Contact us for removal if data submitted.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p>Email: your-email@example.com</p>
      </section>
    </div>
  );
}
```

Then in the GPT Actions settings, set Privacy Policy URL to:
```
https://your-deployment-url.vercel.app/privacy
```

---

### 8. Save and Test

1. Click **"Create"** to save your GPT
2. Test it with: "Use profile_id ritika-001 and generate a combined plan"
3. Copy your GPT's share URL (looks like: `https://chatgpt.com/g/g-abc123xyz`)

---

## Part 2: Configure Your App

### 1. Set Environment Variable

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your GPT share URL:

```bash
NEXT_PUBLIC_LIFEENGINE_GPT_URL="https://chatgpt.com/g/YOUR_GPT_ID_HERE"
```

### 2. Deploy to Production

```bash
# Commit changes
git add .
git commit -m "feat: add Custom GPT integration"
git push

# Deploy to Vercel (if not auto-deployed)
vercel --prod
```

### 3. Update GPT Actions with Production URL

Go back to your Custom GPT → Actions → Edit the OpenAPI schema and replace:
```
https://your-deployment-url.vercel.app
```
with your actual Vercel URL.

---

## Part 3: Usage Flow

### For End Users:

1. Visit your app at `/use-custom-gpt`
2. Click **"Open Custom GPT"** → Opens ChatGPT
3. In ChatGPT, say: "Use profile_id ritika-001 and generate a combined plan"
4. GPT will:
   - Fetch profile via `GET /api/v1/profiles/ritika-001`
   - Generate personalized plan
   - Store it via `POST /api/v1/plans`
5. Return to your app and click **"Refresh Latest Plan"**
6. Beautiful plan preview appears!

---

## API Endpoints

### GET `/api/v1/profiles/{id}`
Fetch a demo profile

**Example:**
```bash
curl http://localhost:3000/api/v1/profiles/ritika-001
```

### POST `/api/v1/plans`
Store a generated plan

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/plans \
  -H "Content-Type: application/json" \
  -d @plan.json
```

### GET `/api/v1/plans/latest?profile_id={id}`
Get the latest plan for a profile

**Example:**
```bash
curl "http://localhost:3000/api/v1/plans/latest?profile_id=ritika-001"
```

---

## Demo Profiles Available

- `ritika-001`: 34F, Mumbai, weight loss + anxiety, PCOS, low sleep
- `demo-002`: 28M, Bangalore, core strength, active, motivated

---

## Testing Checklist

- ✅ TypeScript compiles without errors
- ✅ GET `/api/v1/profiles/ritika-001` returns profile JSON
- ✅ POST `/api/v1/plans` stores plan and returns `plan_id`
- ✅ GET `/api/v1/plans/latest?profile_id=ritika-001` returns stored plan
- ✅ Rate limiting kicks in after 15 requests in 15 seconds
- ✅ UI page loads at `/use-custom-gpt`
- ✅ GPT can call your API endpoints (after deployment)

---

## Rate Limiting

Protection against abuse:
- **15 requests per 15 seconds** per IP
- Applies to `POST /api/v1/plans`
- Returns `429 Too Many Requests` when exceeded

---

## Production Considerations

1. **Replace in-memory storage** with real database:
   - Currently uses `globalThis.__PLANS__` (resets on restart)
   - Replace with Supabase/PostgreSQL/MongoDB

2. **Add authentication** to API endpoints:
   - API Key in headers
   - OAuth for user-specific plans

3. **Add monitoring**:
   - Log all API calls
   - Track plan generation success rates
   - Monitor rate limit hits

4. **Enhance privacy page** with your actual business details

5. **Add more demo profiles** or connect to real user profiles

---

## Troubleshooting

### GPT Actions not working?
- Check if your API is deployed and publicly accessible
- Verify the server URL in OpenAPI schema matches your deployment
- Test endpoints manually with `curl` first

### Plans not showing up?
- Check browser console for errors
- Verify `profile_id` in plan metadata matches query parameter
- Test API endpoints independently

### Rate limiting too strict?
- Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS` in `middleware.ts`

---

## Next Steps

1. ✅ Create your Custom GPT following Part 1
2. ✅ Deploy your app and update GPT Actions URL
3. ✅ Test end-to-end flow
4. 🚀 Share your Custom GPT with users!

---

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

**Happy wellness planning! 🧘‍♀️💪🥗**
