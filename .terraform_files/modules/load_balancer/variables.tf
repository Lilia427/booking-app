variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "prefix" {
  description = "Prefix to be used for all resources"
  type        = string
}

variable "subnet_a_id" {
  description = "Subnet A ID"
  type        = string
}

variable "subnet_b_id" {
  description = "Subnet B ID"
  type        = string
}

variable "subnet_c_id" {
  description = "Subnet C ID"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "app_port" {
  type = number
}

variable "health_check_url" {
  default = "/health"
}

# Uncomment when domain + certificate are ready:
# variable "acm_certificate_arn_be" {
#   description = "ACM certificate ARN"
#   type        = string
# }
