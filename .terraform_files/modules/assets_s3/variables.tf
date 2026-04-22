variable "prefix" {
  description = "Resource name prefix (workspace-project)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "common_tags" {
  description = "Common resource tags"
  type        = map(string)
}

variable "allowed_origins" {
  description = "Origins allowed to upload via presigned URLs (React SPA domain)"
  type        = list(string)
  default     = ["https://runabooking.me"]
}
