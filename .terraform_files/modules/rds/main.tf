resource "aws_db_instance" "db" {
  identifier                 = var.prefix
  engine                     = var.db_engine
  engine_version             = var.db_engine_version
  auto_minor_version_upgrade = var.db_minor_version_upgrade
  instance_class             = var.db_instance_class
  storage_type               = var.db_storage_type
  allocated_storage          = var.db_storage
  max_allocated_storage      = var.db_max_storage
  apply_immediately          = true
  db_subnet_group_name       = aws_db_subnet_group.db-sg.name
  vpc_security_group_ids     = [aws_security_group.rds.id]

  username                    = var.db_username
  manage_master_user_password = true
  db_name                     = var.db_name

  lifecycle {
    ignore_changes = [engine_version]
  }
  # DB is reachable only from inside the VPC (ECS tasks) and via the bastion
  # through SSM Session Manager port forwarding. See CI migrations job.
  publicly_accessible = false
  skip_final_snapshot = true
  port                = var.db_port

  deletion_protection = true
}

resource "aws_db_subnet_group" "db-sg" {
  name       = "rds_subnet_group-${var.environment}"
  subnet_ids = [var.subnet_a_id, var.subnet_b_id, var.subnet_c_id]
  tags = {
    Name = "RDS subnet group"
  }
}

###################RDS SECURITY GROUP################

resource "aws_security_group" "rds" {
  description = "Access for RDS DB"
  name        = "${var.prefix}-RDS"
  vpc_id      = var.vpc_id

  ingress {
    description = "Backend and Bastion"
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    security_groups = [
      var.ecs_sg, var.bastion_sg
    ]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = var.common_tags
}

resource "aws_ssm_parameter" "DB_HOST" {
  name        = "/be/${terraform.workspace}/${var.project_name}/DB_HOST"
  description = "Database host url"
  value       = aws_db_instance.db.address
  type        = "SecureString"
}
resource "aws_ssm_parameter" "DB_NAME" {
  name        = "/be/${terraform.workspace}/${var.project_name}/DB_NAME"
  description = "Database name"
  value       = aws_db_instance.db.db_name
  type        = "SecureString"
}
resource "aws_ssm_parameter" "DB_PORT" {
  name        = "/be/${terraform.workspace}/${var.project_name}/DB_PORT"
  description = "Database port"
  value       = aws_db_instance.db.port
  type        = "SecureString"
}
