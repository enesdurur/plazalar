-- The previous migration only created "Square Plaza" (to hold pre-existing
-- data). Insert the remaining plazas so a plain `prisma migrate deploy`
-- is enough on any environment, without needing to re-run the (non-idempotent)
-- seed script.
INSERT INTO "plazas" ("id", "name") VALUES
  ('default-link-plaza', 'Link Plaza'),
  ('default-olive-plaza', 'Olive Plaza'),
  ('default-dlp-no1-plaza', 'DLP No.1 Plaza'),
  ('default-uso-center', 'Uso Center')
ON CONFLICT ("name") DO NOTHING;
