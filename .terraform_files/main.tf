//=================main configurations============================================
terraform {
  backend "s3" {
    profile              = "booking-terraform"
    bucket               = "booking-app-tfstate"
    workspace_key_prefix = "environments-backend"
    key                  = "resources.tfstate"
    region               = "eu-north-1"
    encrypt              = true
  }
}

provider "aws" {
  region  = local.region
  profile = "booking-terraform"
}

locals {
  prefix      = "${terraform.workspace}-${var.project_name}"
  environment = terraform.workspace
  common_tags = {
    Environment = terraform.workspace
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
  region = var.region
}

data "aws_region" "current" {}

//===============resources from modules==================================
module "bastion" {
  source                = "./modules/bastion"
  project_name          = var.project_name
  prefix                = local.prefix
  common_tags           = local.common_tags
  bastion_desired_count = 1
  vpc_id                = module.vpc.vpc_id
  rds_id                = module.rds.rds_id
  subnet_a_id           = module.vpc.subnet_a_id
}

# module "certificate" {
#   source           = "./modules/certificate"
#   common_tags      = local.common_tags
#   root_domain_name = var.root_domain_name
# }

module "cloud_watch" {
  source      = "./modules/cloud_watch"
  common_tags = local.common_tags
  prefix      = local.prefix
}

module "ecr" {
  source      = "./modules/ecr"
  common_tags = local.common_tags
  prefix      = local.prefix
}

module "ecs_fargate" {
  source              = "./modules/ecs_fargate"
  common_tags         = local.common_tags
  prefix              = local.prefix
  subnet_a_id         = module.vpc.subnet_a_id
  subnet_b_id         = module.vpc.subnet_b_id
  subnet_c_id         = module.vpc.subnet_c_id
  lb_target_group_arn = module.load_balancer.lb_target_group_arn
  vpc_id              = module.vpc.vpc_id
  alb_sg              = module.load_balancer.alb_sg
  app_port            = var.app_port
  task_cpu            = var.task_cpu
  task_memory         = var.task_memory
  task_desired_count  = var.task_desired_count
  app_image           = var.app_image
  region              = var.region
  cf_log_group_name   = module.cloud_watch.cf_log_group_name
}

module "load_balancer" {
  source          = "./modules/load_balancer"
  common_tags     = local.common_tags
  prefix          = local.prefix
  subnet_a_id     = module.vpc.subnet_a_id
  subnet_b_id     = module.vpc.subnet_b_id
  subnet_c_id     = module.vpc.subnet_c_id
  vpc_id          = module.vpc.vpc_id
  app_port        = var.app_port
  health_check_url = var.health_check_url
}

module "rds" {
  source                   = "./modules/rds"
  common_tags              = local.common_tags
  prefix                   = local.prefix
  subnet_a_id              = module.vpc.subnet_a_id
  subnet_b_id              = module.vpc.subnet_b_id
  subnet_c_id              = module.vpc.subnet_c_id
  vpc_id                   = module.vpc.vpc_id
  ecs_sg                   = module.ecs_fargate.ecs_sg
  db_engine                = var.db_engine
  db_engine_version        = var.db_engine_version
  db_minor_version_upgrade = var.db_minor_version_upgrade
  db_instance_class        = var.db_instance_class
  db_storage               = var.db_storage
  db_max_storage           = var.db_max_storage
  db_username              = var.db_username
  db_name                  = var.db_name
  db_port                  = var.db_port
  project_name             = var.project_name
  bastion_sg               = module.bastion.bastion_sg
  environment              = terraform.workspace
}

module "secret_manager" {
  source       = "./modules/secret_manager"
  project_name = var.project_name
  common_tags  = local.common_tags
}

module "vpc" {
  source              = "./modules/vpc"
  common_tags         = local.common_tags
  prefix              = local.prefix
  region              = local.region
  vpc_cidr_block      = var.vpc_cidr_block
  subnet_a_cidr_block = var.subnet_a_cidr_block
  subnet_b_cidr_block = var.subnet_b_cidr_block
  subnet_c_cidr_block = var.subnet_c_cidr_block
}
