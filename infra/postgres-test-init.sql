-- Create the database used by backend integration tests so the same Postgres
-- instance serves both the dev workload (weekly_commit) and the test
-- workload (weekly_commit_test). Tests use the same role.
CREATE DATABASE weekly_commit_test OWNER weekly_commit;
GRANT ALL PRIVILEGES ON DATABASE weekly_commit_test TO weekly_commit;
