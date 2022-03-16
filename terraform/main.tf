terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>4.5.0"
    }
  }
}

provider "aws" {
  allowed_account_ids = var.allowed_account_ids
}
