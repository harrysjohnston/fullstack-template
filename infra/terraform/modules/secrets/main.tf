# -----------------------------------------------------------------------------
# Secrets Module
# Creates AWS Secrets Manager secrets for sensitive configuration
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Database Secret
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "database" {
  name        = "/${var.environment}/database"
  description = "Database credentials and connection info for ${var.name_prefix}"

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = {
    Name        = "${var.name_prefix}-database-secret"
    Environment = var.environment
  }
}

# Initial placeholder value (will be updated by database module)
resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = "placeholder"
    password = var.db_password
    host     = "placeholder"
    port     = 5432
    dbname   = "placeholder"
    url      = "placeholder"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# -----------------------------------------------------------------------------
# JWT Secret
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "jwt" {
  name        = "/${var.environment}/jwt"
  description = "JWT signing secret for ${var.name_prefix}"

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = {
    Name        = "${var.name_prefix}-jwt-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = var.jwt_secret
}

# -----------------------------------------------------------------------------
# App Secrets (S3 credentials, email config, etc.)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "app" {
  name        = "/${var.environment}/app"
  description = "Application secrets for ${var.name_prefix}"

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = {
    Name        = "${var.name_prefix}-app-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    s3_access_key_id     = var.s3_access_key_id
    s3_secret_access_key = var.s3_secret_access_key
  })
}

# -----------------------------------------------------------------------------
# IAM Policy for Reading Secrets
# -----------------------------------------------------------------------------

data "aws_iam_policy_document" "read_secrets" {
  statement {
    sid    = "ReadSecrets"
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = [
      aws_secretsmanager_secret.database.arn,
      aws_secretsmanager_secret.jwt.arn,
      aws_secretsmanager_secret.app.arn
    ]
  }
}

resource "aws_iam_policy" "read_secrets" {
  name        = "${var.name_prefix}-read-secrets"
  description = "Policy to read secrets for ${var.name_prefix}"
  policy      = data.aws_iam_policy_document.read_secrets.json

  tags = {
    Name = "${var.name_prefix}-read-secrets-policy"
  }
}
