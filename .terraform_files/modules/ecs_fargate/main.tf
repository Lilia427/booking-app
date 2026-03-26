resource "aws_ecs_cluster" "main" {
  name = "${var.prefix}-backend"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = var.common_tags

}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

data "aws_iam_policy_document" "task_execution_role_policy" {
  statement {
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "secretsmanager:GetSecretValue",
      "ssm:GetParameters",
      "ec2messages:AcknowledgeMessage",
      "ec2messages:DeleteMessage",
      "ec2messages:FailMessage",
      "ec2messages:GetEndpoint",
      "ec2messages:GetMessages",
      "ec2messages:SendReply"
    ]
    effect    = "Allow"
    resources = ["*"]
  }

}
resource "aws_iam_policy" "task_execution_role_policy" {
  name        = "${var.prefix}-task-exec-role-policy"
  path        = "/"
  description = "Allow retrieving of images and adding to logs"
  policy      = data.aws_iam_policy_document.task_execution_role_policy.json
}


data "template_file" "assume_role_policy" {
  template = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role" "task_execution_role" {
  name               = "${var.prefix}-ecsTaskExecutionRole"
  assume_role_policy = data.template_file.assume_role_policy.rendered

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "task_execution_role" {
  role       = aws_iam_role.task_execution_role.name
  policy_arn = aws_iam_policy.task_execution_role_policy.arn

}

resource "aws_iam_role_policy_attachment" "task_execution_role_ssm" {
  role       = aws_iam_role.task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"

}

data "template_file" "api_container_definitions" {
  template = file("./modules/ecs_fargate/templates/container-definitions.json.tpl")
  vars = {
    app_image        = var.app_image
    log_group_name   = var.cf_log_group_name
    log_group_region = var.region
    app_port         = var.app_port
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.prefix}-backend"
  container_definitions    = data.template_file.api_container_definitions.rendered
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.task_execution_role.arn
  task_role_arn            = aws_iam_role.task_execution_role.arn

  tags = var.common_tags
}

resource "aws_ecs_service" "backend" {
  name                   = "${var.prefix}-backend"
  cluster                = aws_ecs_cluster.main.name
  task_definition        = aws_ecs_task_definition.backend.family
  desired_count          = var.task_desired_count
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets = [
      var.subnet_a_id,
      var.subnet_b_id,
      var.subnet_c_id
    ]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.lb_target_group_arn
    container_name   = "backend"
    container_port   = var.app_port
  }

}

resource "aws_security_group" "ecs" {
  description = "Access for ECS Service"
  name        = "${var.prefix}-ECS"
  vpc_id      = var.vpc_id

  ingress {
    description = "Access from ALB"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    security_groups = [
      var.alb_sg
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
