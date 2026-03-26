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

variable "lb_target_group_arn" {
  description = "ARN of the target group to attach to the load balancer"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}
variable "alb_sg" {
  description = "ALB security group"
  type        = string
}

variable "task_cpu" {
  type    = number
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "task_desired_count" {
  default = 1
}

variable "app_port" {}

variable "app_image" {}

variable "region" {}

variable "cf_log_group_name" {}