output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "web_ecs_security_group_id" {
  description = "ID of the Web ECS security group"
  value       = aws_security_group.ecs_web.id
}

output "api_ecs_security_group_id" {
  description = "ID of the API ECS security group"
  value       = aws_security_group.ecs_api.id
}

output "ecs_security_group_id" {
  description = "Deprecated compatibility output for ECS security group ID (API)"
  value       = aws_security_group.ecs_api.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "nat_gateway_ips" {
  description = "Public IPs of the NAT gateways"
  value       = aws_eip.nat[*].public_ip
}
