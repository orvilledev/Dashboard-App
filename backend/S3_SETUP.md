# S3 Configuration Guide

This guide will help you configure AWS S3 for document storage in the AMZPulse application.

## Prerequisites

- An AWS account (sign up at https://aws.amazon.com/)
- Basic knowledge of AWS services

## Step 1: Create an S3 Bucket

1. Log in to the AWS Console: https://console.aws.amazon.com/
2. Navigate to **S3** service
3. Click **Create bucket**
4. Configure your bucket:
   - **Bucket name**: Choose a unique name (e.g., `amzpulse-documents-yourname`)
   - **Region**: Choose a region (e.g., `us-east-1`)
   - **Block Public Access**: Keep default settings (all blocked)
   - Click **Create bucket**

## Step 2: Create an IAM User for S3 Access

1. Navigate to **IAM** service in AWS Console
2. Click **Users** in the left sidebar
3. Click **Create user**
4. Enter a username (e.g., `amzpulse-s3-user`)
5. Click **Next**
6. Under **Set permissions**, select **Attach policies directly**
7. Search for and select **AmazonS3FullAccess** (or create a custom policy with only the permissions you need)
8. Click **Next**, then **Create user**

## Step 3: Create Access Keys

1. Click on the user you just created
2. Go to the **Security credentials** tab
3. Scroll down to **Access keys**
4. Click **Create access key**
5. Select **Application running outside AWS**
6. Click **Next**, then **Create access key**
7. **IMPORTANT**: Copy both the **Access key ID** and **Secret access key** immediately (you won't be able to see the secret key again)

## Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory (if it doesn't exist) and add your AWS credentials:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_STORAGE_BUCKET_NAME=amzpulse-documents-yourname
AWS_S3_REGION_NAME=us-east-1
```

Replace:
- `your-access-key-id-here` with your actual Access Key ID
- `your-secret-access-key-here` with your actual Secret Access Key
- `amzpulse-documents-yourname` with your actual bucket name
- `us-east-1` with your bucket's region if different

## Step 5: Restart the Backend Server

After adding the environment variables, restart your Django development server:

```powershell
# Stop the server (Ctrl+C), then restart:
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

## Step 6: Test the Configuration

1. Try uploading a document through the application
2. If successful, check your S3 bucket - you should see the uploaded file

## Troubleshooting

### Error: "S3 is not configured"
- Make sure you created a `.env` file in the `backend` directory
- Verify the environment variable names are correct (case-sensitive)
- Restart the Django server after adding environment variables

### Error: "Invalid AWS credentials"
- Double-check your Access Key ID and Secret Access Key
- Make sure there are no extra spaces or quotes in the `.env` file
- Verify the IAM user has the correct permissions

### Error: "S3 bucket does not exist"
- Verify the bucket name in `AWS_STORAGE_BUCKET_NAME` matches your actual bucket name
- Check that the bucket exists in the region specified in `AWS_S3_REGION_NAME`

### Error: "Access denied"
- Verify the IAM user has S3 permissions
- Check that the bucket policy allows your IAM user to access it

## Security Best Practices

1. **Never commit your `.env` file to version control** - it's already in `.gitignore`
2. **Use IAM roles in production** instead of access keys when possible
3. **Limit IAM permissions** to only what's needed (S3 access for specific bucket)
4. **Rotate access keys regularly** for security

## Alternative: Local Development Without S3

If you want to test without S3, you can modify the code to use local file storage in development mode. However, for production, S3 is recommended for scalability and reliability.

