import type { Profile } from "@/lib/ai/schemas";
import type { LifeEnginePlan } from "@/app/types/lifeengine";
import { buildPromptFromForm, PromptBuilderInput, formatFormForAPI } from "./promptBuilder";
import { generatePlanWithGPT, generatePlan, formatErrorMessage } from "./api";
import type { PlanFormState } from "./planConfig";

export type CustomGptResult = {
  plan: LifeEnginePlan;
  rawText: string;
  prompt: string;
  metadata?: any;
};

export async function requestPlanFromCustomGPT(options: {
  form: PlanFormState;
  profileId: string;
  profile?: Profile;
  model?: string;
}): Promise<CustomGptResult> {
  const { form, profileId, profile, model } = options;
  const promptInput: PromptBuilderInput = {
    ...form,
    profileName: profile?.name,
    age: profile?.age,
    gender: profile?.gender,
  };

  const prompt = buildPromptFromForm(promptInput);
  const response = await generatePlanWithGPT({ prompt, profileId, model });
  const planText = response.plan?.trim();

  if (!planText) {
    throw new Error("CustomGPT returned an empty response");
  }

  try {
    const parsed = JSON.parse(planText) as LifeEnginePlan;
    return {
      plan: parsed,
      rawText: planText,
      prompt,
      metadata: response.metadata,
    };
  } catch (error) {
    throw new Error(
      `CustomGPT returned invalid JSON. ${formatErrorMessage(error as Error)}`
    );
  }
}

export async function fallbackToRuleEngine(
  form: PlanFormState,
  profileId: string
): Promise<string> {
  const payload = formatFormForAPI(form, profileId);
  const planResponse = await generatePlan(payload);
  return planResponse.planId;
}
