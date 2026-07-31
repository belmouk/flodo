import * as z from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive(),
  REFRESH_TOKEN_SECRET: z.base64url(),
  ACCESS_TOKEN_SECRET: z.base64url(),
  JWT_ISSUER: z.url(),
  JWT_AUDIENCE: z.url(),
  NODE_ENV: z.enum(["production", "test", "development"]),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment configuration:\n",
    JSON.stringify(z.flattenError(result.error).fieldErrors, null, 2)
  );
  process.exit(1);
}

export default result.data;
