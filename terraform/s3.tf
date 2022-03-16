resource "aws_s3_bucket" "static_assets" {
  bucket = var.static_assets_bucket
}

resource "aws_s3_bucket_acl" "static_assets_acl" {
  bucket = aws_s3_bucket.static_assets.id
  acl    = "private"
}

resource "aws_s3_bucket_cors_configuration" "static_assets_cors" {
  bucket = aws_s3_bucket.static_assets.bucket

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["Content-Length", "Content-Type", "Content-MD5", "ETag"]
    max_age_seconds = 86400
  }
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    "Version":"2012-10-17",
    "Statement":[
      {
        "Sid":"PublicRead",
        "Effect":"Allow",
        "Principal": "*",
        "Action":["s3:GetObject","s3:GetObjectVersion"],
        "Resource":["${aws_s3_bucket.static_assets.arn}/*"]
      }
    ]
  })
}
