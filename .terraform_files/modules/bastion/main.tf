data "aws_ami" "amazon_linux" {
  most_recent = true
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-6.1-x86_64"]
  }
  owners = ["amazon"]
}

resource "aws_iam_role" "bastion" {
  name               = "${var.prefix}-bastion"
  assume_role_policy = file("${path.module}/templates/instance-profile-policy.json")

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "bastion_attach_policy" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  ])
  role       = aws_iam_role.bastion.name
  policy_arn = each.key

}

resource "aws_iam_instance_profile" "bastion" {
  name = "${var.prefix}-bastion-instance-profile"
  role = aws_iam_role.bastion.name

}


resource "aws_launch_template" "bastion" {
  name_prefix   = "${var.prefix}-bastion-lt"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.nano"

  iam_instance_profile {
    name = aws_iam_instance_profile.bastion.name
  }
  network_interfaces {
    associate_public_ip_address = true
    subnet_id                   = var.subnet_a_id
    security_groups             = [aws_security_group.bastion.id]
  }
  tag_specifications {
    resource_type = "instance"
    tags          = merge({ "Name" = "${var.prefix}-bastion" }, var.common_tags)
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "bastion" {
  launch_template {
    id      = aws_launch_template.bastion.id
    version = "$Latest"
  }

  min_size                  = 0
  max_size                  = 1
  desired_capacity          = var.bastion_desired_count
  vpc_zone_identifier       = [var.subnet_a_id]
  health_check_type         = "EC2"
  health_check_grace_period = 300

  tag {
    key                 = "Name"
    value               = "${var.prefix}-bastion"
    propagate_at_launch = true
  }
}


############ BASTION SG ##############
resource "aws_security_group" "bastion" {
  description = "Controll Bastion inbound and outboud traffic"
  name        = "${var.prefix}-bastion"
  vpc_id      = var.vpc_id
  tags        = var.common_tags
}

resource "aws_vpc_security_group_egress_rule" "bastion_to_world" {
  security_group_id = aws_security_group.bastion.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  ip_protocol = "tcp"
  to_port     = 443
}

resource "aws_vpc_security_group_egress_rule" "bastion_to_rds" {
  security_group_id = aws_security_group.bastion.id

  referenced_security_group_id = var.rds_id
  from_port                    = 5432
  ip_protocol                  = "tcp"
  to_port                      = 5432
}