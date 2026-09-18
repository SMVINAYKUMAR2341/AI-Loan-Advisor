resource "google_artifact_registry_repository" "loan_advisor" {
  location      = var.region
  repository_id = "loan-advisor"
  description   = "Docker repository for AI Loan Advisor"
  format        = "DOCKER"
}
