resource "aws_cloudwatch_log_group" "ecs_task_logs" {
  name = "/ecs/${var.prefix}-backend"

  retention_in_days = 90
}