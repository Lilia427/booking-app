output "bucket_name" {
  description = "S3 bucket name — pass to ECS task IAM policy"
  value       = aws_s3_bucket.assets.bucket
}

output "bucket_arn" {
  description = "S3 bucket ARN — used in IAM policy for ECS"
  value       = aws_s3_bucket.assets.arn
}
