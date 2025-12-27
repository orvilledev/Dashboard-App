# Fix S3 Access Denied Error

You're getting an "Access denied" error because your AWS IAM user doesn't have the necessary permissions to access the S3 bucket.

## Quick Fix Steps

### Option 1: Add S3 Full Access (Easiest - for development)

1. **Go to AWS IAM Console**: https://console.aws.amazon.com/iam/
2. **Click "Users"** in the left sidebar
3. **Find and click on your IAM user** (the one with the access key you're using)
4. **Click the "Permissions" tab**
5. **Click "Add permissions"** → **"Attach policies directly"**
6. **Search for "AmazonS3FullAccess"** and check the box
7. **Click "Next"** → **"Add permissions"**

**Note:** This gives full S3 access. For production, use Option 2 for more restricted permissions.

### Option 2: Create Custom Policy (Recommended for production)

1. **Go to AWS IAM Console**: https://console.aws.amazon.com/iam/
2. **Click "Policies"** in the left sidebar
3. **Click "Create policy"**
4. **Click the "JSON" tab** and paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:HeadBucket"
            ],
            "Resource": [
                "arn:aws:s3:::amzpulse-documents",
                "arn:aws:s3:::amzpulse-documents/*"
            ]
        }
    ]
}
```

5. **Click "Next"**
6. **Name the policy**: `AMZPulseDocumentsAccess`
7. **Click "Create policy"**
8. **Go back to Users** → Select your user → **Permissions** → **Add permissions** → **Attach policies directly**
9. **Search for "AMZPulseDocumentsAccess"** and check it
10. **Click "Next"** → **"Add permissions"**

### Option 3: Update Bucket Policy (Alternative)

If you prefer to set permissions at the bucket level:

1. **Go to AWS S3 Console**: https://console.aws.amazon.com/s3/
2. **Click on your bucket**: `amzpulse-documents`
3. **Click the "Permissions" tab**
4. **Scroll to "Bucket policy"** and click "Edit"
5. **Add this policy** (replace `YOUR-IAM-USER-ARN` with your actual IAM user ARN):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAMZPulseAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "YOUR-IAM-USER-ARN"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::amzpulse-documents",
                "arn:aws:s3:::amzpulse-documents/*"
            ]
        }
    ]
}
```

**To find your IAM User ARN:**
- Go to IAM → Users → Click your user
- The ARN is shown at the top (e.g., `arn:aws:iam::123456789012:user/amzpulse-s3-user`)

## After Adding Permissions

1. **Wait 1-2 minutes** for permissions to propagate
2. **Try uploading a document again** in your application
3. The error should be resolved!

## Verify Permissions Work

You can test if permissions are working by running this Python command:

```python
import boto3
from decouple import config

s3 = boto3.client(
    's3',
    aws_access_key_id=config('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=config('AWS_SECRET_ACCESS_KEY'),
    region_name=config('AWS_S3_REGION_NAME', default='us-east-1')
)

# This should work without errors
s3.head_bucket(Bucket=config('AWS_STORAGE_BUCKET_NAME'))
print("✓ Bucket access confirmed!")
```

## Troubleshooting

- **Still getting errors?** Make sure you're using the correct IAM user's access keys
- **Permissions not working?** Wait a few minutes - AWS permissions can take time to propagate
- **Need help?** Check AWS CloudTrail logs to see what specific permission is being denied

