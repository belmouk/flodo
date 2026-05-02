const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable ${key}`);
  return value;
};

const CONFIG = {
  DATABASE_URL: getEnv("DATABASE_URL"),
  PORT: getEnv("PORT"),
  REFRESH_TOKEN_SECRET: getEnv("REFRESH_TOKEN_SECRET"),
  ACCESS_TOKEN_SECRET: getEnv("ACCESS_TOKEN_SECRET"),
  JWT_ISSUER: getEnv("JWT_ISSUER"),
  JWT_AUDIENCE: getEnv("JWT_AUDIENCE"),
  NODE_ENV: getEnv("NODE_ENV"),
};

export default CONFIG;
