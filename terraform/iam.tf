resource "aws_iam_policy" "phone_upload_policy" {
  name        = "iphone-s3-upload"
  path        = "/"
  description = "Policy for images from iphone"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PhoneImagePolicy",
            "Effect": "Allow",
            "Action": [
                "s3:GetObjectVersionTagging",
                "s3:GetObjectAcl",
                "s3:GetBucketObjectLockConfiguration",
                "s3:GetObjectVersionAcl",
                "s3:DeleteObject",
                "s3:GetBucketPolicyStatus",
                "s3:GetObjectRetention",
                "s3:GetBucketWebsite",
                "s3:DeleteObjectVersionTagging",
                "s3:GetObjectLegalHold",
                "s3:GetBucketNotification",
                "s3:GetReplicationConfiguration",
                "s3:ListMultipartUploadParts",
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersionForReplication",
                "s3:GetLifecycleConfiguration",
                "s3:GetInventoryConfiguration",
                "s3:GetBucketTagging",
                "s3:DeleteObjectVersion",
                "s3:GetBucketLogging",
                "s3:ListBucketVersions",
                "s3:RestoreObject",
                "s3:ListBucket",
                "s3:GetAccelerateConfiguration",
                "s3:GetBucketPolicy",
                "s3:GetEncryptionConfiguration",
                "s3:GetObjectVersionTorrent",
                "s3:AbortMultipartUpload",
                "s3:PutBucketTagging",
                "s3:GetBucketRequestPayment",
                "s3:GetObjectTagging",
                "s3:GetMetricsConfiguration",
                "s3:GetBucketPublicAccessBlock",
                "s3:ListBucketMultipartUploads",
                "s3:GetBucketVersioning",
                "s3:GetBucketAcl",
                "s3:GetObjectTorrent",
                "s3:GetBucketCORS",
                "s3:GetBucketLocation",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::rluckom-photo-archive",
                "arn:aws:s3:::rluckom-photo-archive/*"
            ]
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "s3:GetAccessPoint",
                "s3:GetAccountPublicAccessBlock",
                "s3:ListAllMyBuckets",
                "s3:ListAccessPoints",
                "s3:ListJobs",
                "s3:HeadBucket"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

resource "aws_iam_user" "phone" {
  name = "iphone-s3-upload"
  path = "/"

}

resource "aws_iam_user_policy_attachment" "phone_policy_attachment" {
  user       = aws_iam_user.phone.name
  policy_arn = aws_iam_policy.phone_upload_policy.arn
}
