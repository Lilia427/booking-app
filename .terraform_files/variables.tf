variable "project_name" {
  description = "Project name"
  default     = "booking"
  type        = string
}

variable "region" {
  description = "AWS region"
  default     = "eu-north-1"
  type        = string
}

############ VPC MODULE ################

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

############ RDS MODULE ################

variable "db_engine" {
  default = "postgres"
}

variable "db_engine_version" {
  default = "16.2"
}

variable "db_minor_version_upgrade" {
  default = true
}

variable "db_instance_class" {
  default = "db.t4g.micro"
}

variable "db_storage" {
  default = 20
}

variable "db_max_storage" {
  default = 30
}

variable "db_username" {
  default = "postgres"
}

variable "db_name" {
  default = "bookingdb"
}

variable "db_port" {
  default = 5432
}

############ ALB MODULE ################

variable "app_port" {
  type    = number
  default = 3000
}

variable "health_check_url" {
  default = "/health"
}

############ ECS MODULE ################

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

variable "app_image" {
  type = string
}

############ CERTIFICATE MODULE (uncomment when domain is ready) ################
# variable "root_domain_name" {}
