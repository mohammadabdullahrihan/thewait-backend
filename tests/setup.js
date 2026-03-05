// Jest global setup – inject env vars before any module loads
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_thewait_2024";
process.env.JWT_EXPIRE = "7d";
