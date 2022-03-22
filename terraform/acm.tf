# CloudFront can only use ACM certs in us-east-1
resource "aws_acm_certificate" "cloudfront_cert" {
    provider = aws.us-east-1
    domain_name = var.root_domain
    subject_alternative_names = ["*.${var.root_domain}"]
    validation_method = "DNS"

    lifecycle {
      create_before_destroy = true
    }
}
