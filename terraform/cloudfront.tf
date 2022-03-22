locals {
  s3_origin_id = "s3_origin"
}

data "aws_cloudfront_origin_request_policy" "managed_cors_s3_origin" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_cloudfront_cache_policy" "s3_cache_policy" {
  name = "S3-Cache-Policy"
  min_ttl = 1
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "allExcept"
      query_strings {
        items = ["rcid"]
      }
    }

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip = true
  }
}

resource "aws_cloudfront_distribution" "s3" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_domain_name
    origin_id   = local.s3_origin_id

    # Send a dummy Origin header to force S3 to unconditionally add CORS
    # headers to every response.
    # https://serverfault.com/a/856948/657072
    custom_header {
      name  = "Origin"
      value = "https://${var.root_domain}"
    }
  }

  aliases = [var.root_domain]

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id = aws_cloudfront_cache_policy.s3_cache_policy.id
    compress = true
    origin_request_policy_id = (
      data.aws_cloudfront_origin_request_policy.managed_cors_s3_origin.id
    )
    target_origin_id = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.cloudfront_cert.arn
    minimum_protocol_version = "TLSv1.2_2019"
    ssl_support_method = "sni-only"
  }
}
