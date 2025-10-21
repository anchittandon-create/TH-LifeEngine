export const CONTRA:any = {
  pcod:{ yoga_avoid:["prolonged_inversions"], breath_caution:[], diet_notes:["prefer_low_gi","anti_inflammatory"] },
  pregnancy:{ yoga_avoid:["deep_twists","hot_yoga"], breath_caution:["long_breath_retention"], diet_notes:["avoid_unpasteurized"] },
  back_pain:{ yoga_avoid:["deep_forward_flexion"], breath_caution:[], diet_notes:[] },
  hypertension:{ yoga_avoid:["max_exertion_flows"], breath_caution:["kapalbhati"], diet_notes:["low_sodium"] }
};

export function checkContras(profile: any, activityType: string) {
  const flags = profile.medical_flags || [];
  const issues: string[] = [];
  for (const flag of flags) {
    const contra = CONTRA[flag];
    if (contra) {
      if (activityType === 'yoga' && contra.yoga_avoid.includes(activityType)) {
        issues.push(`${flag}: avoid ${activityType}`);
      }
      if (activityType === 'breath' && contra.breath_caution.includes(activityType)) {
        issues.push(`${flag}: caution with ${activityType}`);
      }
    }
  }
  return { safe: issues.length === 0, reasons: issues };
}