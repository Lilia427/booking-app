resource "aws_secretsmanager_secret" "secret_backend" {
  name = "${terraform.workspace}/${var.project_name}/backend-new"

  description = "Stores environment variables for ${terraform.workspace} ${var.project_name} backend"
  tags        = var.common_tags
}
