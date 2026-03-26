variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "prefix" {
  description = "Prefix to be applied to all resources"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}
variable "vpc_cidr_block" {
  default = "10.0.0.0/16"
}

variable "subnet_a_cidr_block" {
  default = "10.0.1.0/24"
}

variable "subnet_b_cidr_block" {
  default = "10.0.2.0/24"
}

variable "subnet_c_cidr_block" {
  default = "10.0.3.0/24"
}
