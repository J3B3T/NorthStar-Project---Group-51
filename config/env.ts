import dotenv from 'dotenv';

dotenv.config();

export function initEnvValidation(): void {
  const requiredEnvVars = ['GEMINI_API_KEY'];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(', ')}. ` +
        'Some features may not work correctly. Please set these in your .env file.'
    );
  }

  const port = process.env.PORT;
  if (port && isNaN(Number(port))) {
    throw new Error(`PORT must be a number, got: ${port}`);
  }
}
