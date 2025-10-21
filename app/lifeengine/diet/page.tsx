"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import styles from "./page.module.css";

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: string;
  goals: string[];
  healthConcerns?: string;
  experience: string;
  preferredTime: string;
  subscriptionType: string;
}

interface DietPlan {
  id: string;
  profileId: string;
  goals: string[];
  preferences: {
    dietaryRestrictions: string[];
    allergies: string[];
    cuisinePreferences: string[];
    mealFrequency: number;
    budget: string;
  };
  generatedPlan: {
    dailyCalories: number;
    macronutrients: {
      protein: number;
      carbs: number;
      fats: number;
    };
    mealPlan: {
      breakfast: string[];
      lunch: string[];
      dinner: string[];
      snacks: string[];
    };
    shoppingList: string[];
  };
  createdAt: string;
}

export default function DietBuilderPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DietPlan | null>(null);

  // Form state
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [mealFrequency, setMealFrequency] = useState(3);
  const [budget, setBudget] = useState("moderate");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch("/api/lifeengine/profiles");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
        if (data.profiles?.length > 0 && !selectedProfileId) {
          setSelectedProfileId(data.profiles[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  };

  const handleRestrictionChange = (restriction: string, checked: boolean) => {
    if (checked) {
      setDietaryRestrictions(prev => [...prev, restriction]);
    } else {
      setDietaryRestrictions(prev => prev.filter(r => r !== restriction));
    }
  };

  const handleAllergyChange = (allergy: string, checked: boolean) => {
    if (checked) {
      setAllergies(prev => [...prev, allergy]);
    } else {
      setAllergies(prev => prev.filter(a => a !== allergy));
    }
  };

  const handleCuisineChange = (cuisine: string, checked: boolean) => {
    if (checked) {
      setCuisinePreferences(prev => [...prev, cuisine]);
    } else {
      setCuisinePreferences(prev => prev.filter(c => c !== cuisine));
    }
  };

  const generateDietPlan = async () => {
    if (!selectedProfileId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/lifeengine/diet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfileId,
          preferences: {
            dietaryRestrictions,
            allergies,
            cuisinePreferences,
            mealFrequency,
            budget,
            additionalNotes,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate diet plan");

      const data = await response.json();
      setGeneratedPlan(data.plan);
    } catch (error) {
      console.error("Diet generation error:", error);
      alert("Failed to generate diet plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Diet Builder</h1>
        <p className={styles.subtitle}>
          Create personalized meal plans based on your profile and preferences
        </p>
      </header>

      <div className={styles.content}>
        {/* Profile Selection */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Select Profile</h2>
          <Field label="Choose a profile for personalized recommendations">
            <Select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
            >
              <option value="">Select a profile</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.age}y, {profile.goals.join(", ")})
                </option>
              ))}
            </Select>
          </Field>
          {selectedProfile && (
            <div className={styles.profileSummary}>
              <strong>{selectedProfile.name}</strong> • Goals: {selectedProfile.goals.join(", ")}
              {selectedProfile.healthConcerns && ` • Health: ${selectedProfile.healthConcerns}`}
            </div>
          )}
        </section>

        {/* Dietary Preferences */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dietary Preferences</h2>

          <div className={styles.preferencesGrid}>
            <div className={styles.preferenceGroup}>
              <h3>Dietary Restrictions</h3>
              <div className={styles.checkboxGrid}>
                {["Vegetarian", "Vegan", "Keto", "Paleo", "Mediterranean", "Low-Carb", "Gluten-Free"].map(restriction => (
                  <label key={restriction} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={dietaryRestrictions.includes(restriction)}
                      onChange={(e) => handleRestrictionChange(restriction, e.target.checked)}
                    />
                    {restriction}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.preferenceGroup}>
              <h3>Allergies</h3>
              <div className={styles.checkboxGrid}>
                {["Nuts", "Dairy", "Eggs", "Soy", "Shellfish", "Wheat", "Fish"].map(allergy => (
                  <label key={allergy} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={allergies.includes(allergy)}
                      onChange={(e) => handleAllergyChange(allergy, e.target.checked)}
                    />
                    {allergy}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.preferenceGroup}>
              <h3>Cuisine Preferences</h3>
              <div className={styles.checkboxGrid}>
                {["Italian", "Mexican", "Asian", "Mediterranean", "American", "Indian", "Middle Eastern"].map(cuisine => (
                  <label key={cuisine} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={cuisinePreferences.includes(cuisine)}
                      onChange={(e) => handleCuisineChange(cuisine, e.target.checked)}
                    />
                    {cuisine}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <Field label="Meals per day">
              <Select
                value={mealFrequency.toString()}
                onChange={(e) => setMealFrequency(parseInt(e.target.value))}
              >
                <option value="2">2 meals</option>
                <option value="3">3 meals</option>
                <option value="4">4 meals</option>
                <option value="5">5 meals</option>
              </Select>
            </Field>

            <Field label="Budget">
              <Select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="budget">Budget-friendly</option>
                <option value="moderate">Moderate</option>
                <option value="premium">Premium</option>
              </Select>
            </Field>
          </div>

          <Field label="Additional Notes (optional)">
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specific preferences, dislikes, or requirements..."
              rows={3}
            />
          </Field>
        </section>

        {/* Generate Button */}
        <div className={styles.actions}>
          <Button
            onClick={generateDietPlan}
            disabled={loading || !selectedProfileId}
            className={styles.generateButton}
          >
            {loading ? "Generating Plan..." : "Generate Diet Plan"}
          </Button>
        </div>

        {/* Generated Plan Display */}
        {generatedPlan && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Personalized Diet Plan</h2>

            <div className={styles.planOverview}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{generatedPlan.generatedPlan.dailyCalories}</span>
                <span className={styles.metricLabel}>Daily Calories</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{generatedPlan.generatedPlan.macronutrients.protein}g</span>
                <span className={styles.metricLabel}>Protein</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{generatedPlan.generatedPlan.macronutrients.carbs}g</span>
                <span className={styles.metricLabel}>Carbs</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{generatedPlan.generatedPlan.macronutrients.fats}g</span>
                <span className={styles.metricLabel}>Fats</span>
              </div>
            </div>

            <div className={styles.mealPlan}>
              <h3>Sample Daily Meal Plan</h3>

              <div className={styles.meal}>
                <h4>Breakfast</h4>
                <ul>
                  {generatedPlan.generatedPlan.mealPlan.breakfast.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.meal}>
                <h4>Lunch</h4>
                <ul>
                  {generatedPlan.generatedPlan.mealPlan.lunch.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.meal}>
                <h4>Dinner</h4>
                <ul>
                  {generatedPlan.generatedPlan.mealPlan.dinner.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {generatedPlan.generatedPlan.mealPlan.snacks.length > 0 && (
                <div className={styles.meal}>
                  <h4>Snacks</h4>
                  <ul>
                    {generatedPlan.generatedPlan.mealPlan.snacks.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.shoppingList}>
              <h3>Shopping List</h3>
              <ul>
                {generatedPlan.generatedPlan.shoppingList.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className={styles.planActions}>
              <Button variant="ghost">Save Plan</Button>
              <Button variant="ghost">Export PDF</Button>
              <Button variant="ghost">Share Plan</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}