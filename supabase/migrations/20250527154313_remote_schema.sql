

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."extractor_type" AS ENUM (
    'textract',
    'ocr',
    'manual'
);


ALTER TYPE "public"."extractor_type" OWNER TO "postgres";


CREATE TYPE "public"."plan_type" AS ENUM (
    'free',
    'basic',
    'pro',
    'enterprise'
);


ALTER TYPE "public"."plan_type" OWNER TO "postgres";


CREATE TYPE "public"."processing_status" AS ENUM (
    'pending',
    'uploading',
    'uploaded',
    'extracting',
    'extracted',
    'structuring',
    'structured',
    'publishing',
    'completed',
    'failed'
);


ALTER TYPE "public"."processing_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_api_call_count"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_quota RECORD;
BEGIN
  -- Get user's quota information
  SELECT * INTO user_quota FROM public.api_quotas WHERE user_id = p_user_id FOR UPDATE;
  
  -- If no quota record or user has exceeded their daily limit
  IF user_quota IS NULL OR user_quota.api_calls_today >= user_quota.max_api_calls_per_day THEN
    RETURN false;
  END IF;
  
  -- Increment the API call count
  UPDATE public.api_quotas
  SET api_calls_today = api_calls_today + 1
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."increment_api_call_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_upload_count"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_quota RECORD;
BEGIN
  -- Get user's quota information
  SELECT * INTO user_quota FROM public.api_quotas WHERE user_id = p_user_id FOR UPDATE;
  
  -- If no quota record or user has exceeded their monthly limit
  IF user_quota IS NULL OR user_quota.uploads_this_month >= user_quota.max_uploads_per_month THEN
    RETURN false;
  END IF;
  
  -- Increment the upload count
  UPDATE public.api_quotas
  SET uploads_this_month = uploads_this_month + 1
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."increment_upload_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_processing_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.processing_stats;
END;
$$;


ALTER FUNCTION "public"."refresh_processing_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_api_calls_count"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.api_quotas
  SET api_calls_today = 0,
      updated_at = now();
END;
$$;


ALTER FUNCTION "public"."reset_api_calls_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_uploads"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.api_quotas
  SET uploads_this_month = 0,
      quota_reset_date = now() + interval '30 days',
      updated_at = now()
  WHERE quota_reset_date <= now();
END;
$$;


ALTER FUNCTION "public"."reset_monthly_uploads"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_endpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "structure_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "schema" "jsonb" NOT NULL,
    "version" "text" DEFAULT 'v1'::"text" NOT NULL,
    "url" "text" NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uses" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone,
    CONSTRAINT "api_endpoints_slug_check" CHECK ((("length"("slug") >= 3) AND ("length"("slug") <= 50)))
);


ALTER TABLE "public"."api_endpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "allowed_origins" "text"[],
    "rate_limit" integer DEFAULT 60,
    CONSTRAINT "api_keys_key_check" CHECK (("length"("key") >= 30)),
    CONSTRAINT "key_format" CHECK (("key" ~ '^exp_[a-zA-Z0-9_]+$'::"text"))
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_quotas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan" "public"."plan_type" DEFAULT 'free'::"public"."plan_type" NOT NULL,
    "max_uploads_per_month" integer DEFAULT 10 NOT NULL,
    "max_api_calls_per_day" integer DEFAULT 100 NOT NULL,
    "uploads_this_month" integer DEFAULT 0 NOT NULL,
    "api_calls_today" integer DEFAULT 0 NOT NULL,
    "quota_reset_date" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_quotas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."extraction_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "extractor_type" "public"."extractor_type" NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "page_count" integer NOT NULL,
    "s3_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "extraction_results_page_count_check" CHECK (("page_count" > 0))
);


ALTER TABLE "public"."extraction_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "filename" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "category" "text" NOT NULL,
    "s3_key" "text" NOT NULL,
    "status" "public"."processing_status" DEFAULT 'pending'::"public"."processing_status" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "error" "jsonb",
    "result" "jsonb",
    CONSTRAINT "error_only_for_failed_status" CHECK (((("status" <> 'failed'::"public"."processing_status") AND ("error" IS NULL)) OR ("status" = 'failed'::"public"."processing_status"))),
    CONSTRAINT "processing_jobs_file_size_check" CHECK (("file_size" > 0)),
    CONSTRAINT "processing_jobs_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."processing_jobs" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."processing_stats" AS
 SELECT "date_trunc"('day'::"text", "processing_jobs"."created_at") AS "day",
    "count"(*) AS "total_jobs",
    "count"(
        CASE
            WHEN ("processing_jobs"."status" = 'completed'::"public"."processing_status") THEN 1
            ELSE NULL::integer
        END) AS "completed_jobs",
    "count"(
        CASE
            WHEN ("processing_jobs"."status" = 'failed'::"public"."processing_status") THEN 1
            ELSE NULL::integer
        END) AS "failed_jobs",
    "avg"(
        CASE
            WHEN ("processing_jobs"."status" = 'completed'::"public"."processing_status") THEN (EXTRACT(epoch FROM "processing_jobs"."updated_at") - EXTRACT(epoch FROM "processing_jobs"."created_at"))
            ELSE NULL::numeric
        END) AS "avg_processing_time_seconds"
   FROM "public"."processing_jobs"
  GROUP BY ("date_trunc"('day'::"text", "processing_jobs"."created_at"))
  WITH NO DATA;


ALTER TABLE "public"."processing_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."structure_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "extraction_id" "uuid" NOT NULL,
    "structure_type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "s3_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "model_info" "jsonb"
);


ALTER TABLE "public"."structure_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "api_key_id" "uuid",
    "endpoint_id" "uuid",
    "ip_address" "text",
    "user_agent" "text",
    "request_path" "text" NOT NULL,
    "status_code" integer NOT NULL,
    "response_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usage_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_endpoints"
    ADD CONSTRAINT "api_endpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_endpoints"
    ADD CONSTRAINT "api_endpoints_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_quotas"
    ADD CONSTRAINT "api_quotas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extraction_results"
    ADD CONSTRAINT "extraction_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extraction_results"
    ADD CONSTRAINT "extraction_results_s3_key_key" UNIQUE ("s3_key");



ALTER TABLE ONLY "public"."api_endpoints"
    ADD CONSTRAINT "one_api_per_structure" UNIQUE ("structure_id");



ALTER TABLE ONLY "public"."extraction_results"
    ADD CONSTRAINT "one_extraction_per_job" UNIQUE ("job_id");



ALTER TABLE ONLY "public"."api_quotas"
    ADD CONSTRAINT "one_quota_per_user" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."structure_results"
    ADD CONSTRAINT "one_structure_per_extraction" UNIQUE ("extraction_id");



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_s3_key_key" UNIQUE ("s3_key");



ALTER TABLE ONLY "public"."structure_results"
    ADD CONSTRAINT "structure_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."structure_results"
    ADD CONSTRAINT "structure_results_s3_key_key" UNIQUE ("s3_key");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_api_endpoints_is_public" ON "public"."api_endpoints" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_api_endpoints_job_id" ON "public"."api_endpoints" USING "btree" ("job_id");



CREATE INDEX "idx_api_endpoints_slug" ON "public"."api_endpoints" USING "btree" ("slug");



CREATE INDEX "idx_api_keys_key" ON "public"."api_keys" USING "btree" ("key");



CREATE INDEX "idx_api_keys_user_id" ON "public"."api_keys" USING "btree" ("user_id");



CREATE INDEX "idx_extraction_results_job_id" ON "public"."extraction_results" USING "btree" ("job_id");



CREATE INDEX "idx_processing_jobs_created_at" ON "public"."processing_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_processing_jobs_status" ON "public"."processing_jobs" USING "btree" ("status");



CREATE INDEX "idx_processing_jobs_user_id" ON "public"."processing_jobs" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_processing_stats_day" ON "public"."processing_stats" USING "btree" ("day");



CREATE INDEX "idx_structure_results_extraction_id" ON "public"."structure_results" USING "btree" ("extraction_id");



CREATE INDEX "idx_structure_results_job_id" ON "public"."structure_results" USING "btree" ("job_id");



CREATE INDEX "idx_usage_logs_created_at" ON "public"."usage_logs" USING "btree" ("created_at");



CREATE INDEX "idx_usage_logs_endpoint_id" ON "public"."usage_logs" USING "btree" ("endpoint_id");



CREATE INDEX "idx_usage_logs_user_id" ON "public"."usage_logs" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_api_quotas_timestamp" BEFORE UPDATE ON "public"."api_quotas" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_processing_jobs_timestamp" BEFORE UPDATE ON "public"."processing_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."api_endpoints"
    ADD CONSTRAINT "api_endpoints_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."processing_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_endpoints"
    ADD CONSTRAINT "api_endpoints_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "public"."structure_results"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_quotas"
    ADD CONSTRAINT "api_quotas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."extraction_results"
    ADD CONSTRAINT "extraction_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."processing_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."processing_jobs"
    ADD CONSTRAINT "processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."structure_results"
    ADD CONSTRAINT "structure_results_extraction_id_fkey" FOREIGN KEY ("extraction_id") REFERENCES "public"."extraction_results"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."structure_results"
    ADD CONSTRAINT "structure_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."processing_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anonymous users can access public API endpoints" ON "public"."api_endpoints" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public API endpoints are viewable by anyone" ON "public"."api_endpoints" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public read access to public endpoints" ON "public"."api_endpoints" FOR SELECT USING (("is_public" = true));



CREATE POLICY "System and user operations on endpoints" ON "public"."api_endpoints" USING ((EXISTS ( SELECT 1
   FROM "public"."processing_jobs"
  WHERE (("processing_jobs"."id" = "api_endpoints"."job_id") AND (("processing_jobs"."user_id" IS NULL) OR ("auth"."uid"() = "processing_jobs"."user_id"))))));



CREATE POLICY "System and user operations on extractions" ON "public"."extraction_results" USING ((EXISTS ( SELECT 1
   FROM "public"."processing_jobs"
  WHERE (("processing_jobs"."id" = "extraction_results"."job_id") AND (("processing_jobs"."user_id" IS NULL) OR ("auth"."uid"() = "processing_jobs"."user_id"))))));



CREATE POLICY "System and user operations on jobs" ON "public"."processing_jobs" USING ((("user_id" IS NULL) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "System and user operations on structures" ON "public"."structure_results" USING ((EXISTS ( SELECT 1
   FROM "public"."processing_jobs"
  WHERE (("processing_jobs"."id" = "structure_results"."job_id") AND (("processing_jobs"."user_id" IS NULL) OR ("auth"."uid"() = "processing_jobs"."user_id"))))));



CREATE POLICY "Users can create their own API keys" ON "public"."api_keys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own API keys" ON "public"."api_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own API endpoints" ON "public"."api_endpoints" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."processing_jobs"
  WHERE (("processing_jobs"."id" = "api_endpoints"."job_id") AND ("processing_jobs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own API keys" ON "public"."api_keys" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own API endpoints" ON "public"."api_endpoints" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."processing_jobs"
  WHERE (("processing_jobs"."id" = "api_endpoints"."job_id") AND ("processing_jobs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own API keys" ON "public"."api_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own quotas" ON "public"."api_quotas" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own structure results" ON "public"."structure_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."processing_jobs"
  WHERE (("processing_jobs"."id" = "structure_results"."job_id") AND ("processing_jobs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own usage logs" ON "public"."usage_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."api_endpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_quotas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."extraction_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."processing_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."structure_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_logs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."increment_api_call_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_api_call_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_api_call_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_upload_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_upload_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_upload_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_processing_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_processing_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_processing_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_api_calls_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_api_calls_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_api_calls_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_uploads"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_uploads"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_uploads"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."api_endpoints" TO "anon";
GRANT ALL ON TABLE "public"."api_endpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."api_endpoints" TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."api_quotas" TO "anon";
GRANT ALL ON TABLE "public"."api_quotas" TO "authenticated";
GRANT ALL ON TABLE "public"."api_quotas" TO "service_role";



GRANT ALL ON TABLE "public"."extraction_results" TO "anon";
GRANT ALL ON TABLE "public"."extraction_results" TO "authenticated";
GRANT ALL ON TABLE "public"."extraction_results" TO "service_role";



GRANT ALL ON TABLE "public"."processing_jobs" TO "anon";
GRANT ALL ON TABLE "public"."processing_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."processing_stats" TO "anon";
GRANT ALL ON TABLE "public"."processing_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."processing_stats" TO "service_role";



GRANT ALL ON TABLE "public"."structure_results" TO "anon";
GRANT ALL ON TABLE "public"."structure_results" TO "authenticated";
GRANT ALL ON TABLE "public"."structure_results" TO "service_role";



GRANT ALL ON TABLE "public"."usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_logs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
