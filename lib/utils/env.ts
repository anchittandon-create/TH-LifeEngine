export const ENV = {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? "",
};

export function assertEnv() {
  if (!ENV.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is required. Set it in the environment.");
  }
}
