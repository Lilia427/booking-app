resource "aws_s3_bucket" "assets" {
  bucket = "${var.prefix}-assets"
  tags   = var.common_tags
}

# Public read access — cottage photos must be visible to all visitors
resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Allow anyone to read objects (GET) — needed for img src in the frontend
resource "aws_s3_bucket_policy" "assets_public_read" {
  bucket     = aws_s3_bucket.assets.id
  depends_on = [aws_s3_bucket_public_access_block.assets]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.assets.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Remove non-current versions after 30 days to control storage costs
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# CORS: admin browser uploads directly via presigned PUT URLs
resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Expose bucket name to the NestJS app via SSM Parameter Store
# CircleCI injects this automatically through the existing inject_secrets command
resource "aws_ssm_parameter" "assets_bucket" {
  name        = "/be/${terraform.workspace}/${var.project_name}/ASSETS_BUCKET"
  description = "S3 assets bucket for cottage photo management"
  value       = aws_s3_bucket.assets.bucket
  type        = "String"
  tags        = var.common_tags
}
