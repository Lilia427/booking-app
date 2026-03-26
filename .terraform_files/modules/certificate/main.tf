
resource "aws_acm_certificate" "certificate_backend" {
  domain_name       = "*.${var.root_domain_name}"
  validation_method = "DNS"
  tags              = var.common_tags

  lifecycle {
    create_before_destroy = true
  }
}
