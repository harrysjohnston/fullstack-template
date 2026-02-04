# Deployment Plan (Bootstrap + Staging/Production)

Goal: pushes to `staging` and `main` trigger cloud deployments; PRs flow from `development`  `staging` (deploy)  `main` (prod deploy). Provide a way to pause/scale down deployments to save cost.

## Current State (verified in codebase)

- Deploy workflow triggers on `push` to `staging` and `main`, and supports manual `workflow_dispatch` with `environment` input. It builds/pushes GHCR images, applies Terraform, runs migrations as an ECS run-task, and creates a release for production deployments. (`.github/workflows/deploy.yml`)
- Terraform supports workspaces with `dev`, `staging`, and `prod` environment configs. Staging has smaller defaults. (`infra/terraform/main.tf`)
- ECS tasks support private GHCR pulls using a Secrets Manager secret (`/ENV/ghcr`) when `ghcr_token` is set; the execution role can read Secrets Manager. (`infra/terraform/modules/secrets/*`, `infra/terraform/modules/ecs/*`)
- Terraform backend is committed with a specific S3/DynamoDB backend (`harry-tf-state`, `terraform-locks`, `eu-west-2`). (`infra/terraform/backend.tf`)
- `infra/README.md` documents only `dev`/`prod` workspaces and sizing (staging is missing).
- Cost-control variables exist (`ecs_desired_count_override`, `ecs_ignore_desired_count`) but ECS services always ignore `desired_count` changes, so the pause flow does not work as documented. (`infra/terraform/modules/ecs/main.tf`)
- Storage bucket is created by Terraform (`modules/storage`), but the bootstrap plan describes creating it manually; pre-creating it will require import or Terraform changes.

## Gaps / Risks (from both plans)

- **Backend portability**: `backend.tf` is hard-coded to a specific bucket/region; CI requires explicit AWS region env vars. Region mismatch will break `terraform init`.
- **OIDC trust scope**: bootstrap config restricts trust to `staging` branch only; production deploys will fail unless a prod role or widened trust is added.
- **S3 ownership mismatch**: manual creation vs Terraform-managed resource can cause apply failures.
- **GHCR push 403**: still depends on GitHub package access, workflow permissions, or PAT configuration.

## Updated Combined Plan

1. **Confirm environment model**
   - Branch flow remains `development`  `staging`  `main`.
   - Decide AWS region(s) for staging and production.

2. **Bootstrap remote state (repeatable)**
   - Provision S3 + DynamoDB for Terraform state (script or separate bootstrap stack).
   - Parameterize backend config (e.g., `backend.hcl` or templated `backend.tf`) so repo is portable.
   - Align backend region with `AWS_REGION` used by GitHub environments.

3. **Bootstrap GitHub  AWS auth**
   - Create GitHub OIDC provider (once per AWS account).
   - Create **per-environment** IAM roles (staging + production) with:
     - Terraform provisioning permissions
     - S3/DynamoDB state access
     - `iam:PassRole` for ECS task roles
   - Restrict trust to repo + branch or environment as desired.

4. **GitHub Environments + secrets**
   - Create `staging` and `production` environments.
   - Add required secrets/vars: `AWS_ROLE_ARN`, `DB_PASSWORD`, `JWT_SECRET`, `S3_BUCKET_NAME`, `AWS_REGION`.
   - Add optional secrets/vars: `GHCR_USERNAME`, `GHCR_TOKEN`, `CORS_ORIGINS`, `ENABLE_HTTPS`, `CERTIFICATE_ARN`, email vars, `NEXT_PUBLIC_API_URL`.

5. **Terraform env config + fixes**
   - Ensure `staging` workspace exists and remains the default for staging deploys.
   - Fix `ecs_ignore_desired_count` so the pause flow works (use variable to control lifecycle).
   - Decide on S3 bucket ownership: let Terraform create it or import existing bucket.

6. **Deploy workflow hardening**
   - Verify GHCR package access and `packages: write` permissions; use PAT if needed.
   - Validate image namespace (`ghcr.io/<owner>/<repo>-api|web`).
   - Confirm Terraform `init` uses correct backend and workspace.

7. **Migrations**
   - Keep migrations in ECS run-task within the VPC (already implemented).
   - Maintain a `skip_migration` override for emergencies (already implemented).

8. **Cost control**
   - Use Terraform overrides to pause services:
     - `ecs_desired_count_override = 0`
     - `ecs_ignore_desired_count = false`
   - Optional: stop non-prod RDS instances with `aws rds stop-db-instance`.
   - Full teardown: `terraform destroy` for staging when unused.

9. **Documentation alignment**
   - Update `infra/README.md` to include staging workspace and sizing.
   - Update `docs/deployment.md` to clarify backend config, regions, and S3 ownership.

## Open Questions

- Should staging mirror production sizing or remain minimal?
- Should GHCR images be public (simpler ECS) or private (more secure)?
- Should backend provisioning be fully automated as part of repo bootstrap?
- Separate IAM roles for staging and production, or a single role with environment conditions?
