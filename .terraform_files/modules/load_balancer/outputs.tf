output "lb_target_group_arn" {
  value = aws_lb_target_group.backend.arn
}

output "aws_lb_arn" {
  value = aws_lb.backend.arn
}

output "alb_sg" {
  value = aws_security_group.alb.id
}
