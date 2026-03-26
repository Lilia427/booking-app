[
    {
        "name": "backend",
        "image": "${app_image}",
        "essential": true,
        "logConfiguration": {
            "logDriver": "awslogs",
            "secretOptions": null,
            "options": {
            "awslogs-group": "${log_group_name}",
            "awslogs-region": "${log_group_region}",
            "awslogs-stream-prefix": "backend"
            }
        },
        "portMappings": [
            {
            "hostPort": 3000,
            "protocol": "tcp",
            "containerPort": 3000
            }
        ]
    }
]
