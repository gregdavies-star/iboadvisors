#!/usr/bin/env bash
# One-time setup for keyless Google auth from GitHub Actions (Workload Identity Federation).
# Run this in Google Cloud Shell (the >_ icon in the Cloud console) as the project's Owner.
# It never creates a service-account key, so it works under the
# iam.managed.disableServiceAccountKeyCreation org policy.
#
#   bash scripts/setup-gcp-wif.sh <PROJECT_ID> [GITHUB_OWNER/REPO]
#
# Afterwards, add the two printed values as GitHub Actions *variables* (not secrets) and add the
# printed service-account email as an Owner on the Search Console property.
set -euo pipefail

PROJECT_ID="${1:?usage: setup-gcp-wif.sh <PROJECT_ID> [owner/repo]}"
REPO="${2:-gregdavies-star/iboadvisors}"
SA_NAME="gsc-daily"
POOL="github"
PROVIDER="github"

gcloud config set project "$PROJECT_ID" >/dev/null
echo "Enabling APIs..."
gcloud services enable searchconsole.googleapis.com iamcredentials.googleapis.com sts.googleapis.com

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  echo "Creating service account $SA_EMAIL..."
  gcloud iam service-accounts create "$SA_NAME" --display-name "Search Console daily job"
fi

if ! gcloud iam workload-identity-pools describe "$POOL" --location global >/dev/null 2>&1; then
  echo "Creating workload identity pool..."
  gcloud iam workload-identity-pools create "$POOL" --location global --display-name "GitHub Actions"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER" --location global --workload-identity-pool "$POOL" >/dev/null 2>&1; then
  echo "Creating GitHub OIDC provider (locked to $REPO)..."
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
    --location global --workload-identity-pool "$POOL" \
    --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition "assertion.repository == '${REPO}'"
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format 'value(projectNumber)')
echo "Allowing $REPO workflows to act as $SA_EMAIL..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}" >/dev/null

cat <<OUT

Done. Now:

1. GitHub -> Settings -> Secrets and variables -> Actions -> Variables tab -> add:
   GCP_WORKLOAD_IDENTITY_PROVIDER = projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}
   GCP_SERVICE_ACCOUNT            = ${SA_EMAIL}

2. Search Console -> Settings -> Users and permissions -> Add user:
   ${SA_EMAIL}   (permission: Owner)

3. GitHub -> Actions -> "SEO daily" -> Run workflow.
OUT
