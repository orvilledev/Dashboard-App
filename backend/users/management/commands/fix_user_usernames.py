"""
Management command to fix existing users with missing emails or improper usernames.
This command will:
1. Generate proper usernames from email addresses or names
2. Update users that have clerk_id as username
3. Ensure all users have proper usernames
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User
import re


class Command(BaseCommand):
    help = 'Fix existing users by generating proper usernames and ensuring emails are set'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update even if username looks valid',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information about all users',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        verbose = options['verbose']
        
        self.stdout.write(self.style.SUCCESS('Starting user fix process...'))
        self.stdout.write('')
        
        # Get all users
        users = User.objects.all()
        total_users = users.count()
        updated_count = 0
        skipped_count = 0
        
        self.stdout.write(f'Found {total_users} users to check')
        self.stdout.write('')
        
        with transaction.atomic():
            for user in users:
                if verbose:
                    self.stdout.write(f'Checking User ID {user.id}:')
                    self.stdout.write(f'  Username: "{user.username}"')
                    self.stdout.write(f'  Email: "{user.email or "(empty)"}"')
                    self.stdout.write(f'  Clerk ID: "{user.clerk_id}"')
                    full_name = f"{user.first_name} {user.last_name}".strip()
                    self.stdout.write(f'  Name: "{full_name or "(empty)"}"')
                    self.stdout.write('')
                needs_update = False
                old_username = user.username
                old_email = user.email
                new_username = None
                new_email = None
                
                # Check if username needs fixing (starts with 'user_' or is the clerk_id)
                # Also check if username looks like a Clerk ID (long alphanumeric string)
                is_clerk_id_like = user.clerk_id and (
                    user.username == user.clerk_id or
                    (len(user.username) > 20 and user.clerk_id in user.username)
                )
                
                username_needs_fix = (
                    user.username.startswith('user_') or 
                    is_clerk_id_like or
                    (force and not user.email and not user.first_name and not user.last_name)
                )
                
                if verbose:
                    self.stdout.write(f'  Username needs fix: {username_needs_fix}')
                    self.stdout.write(f'  Is clerk_id-like: {is_clerk_id_like}')
                
                # Generate new username if needed
                if username_needs_fix:
                    if user.email:
                        # Try to generate from email (best option)
                        new_username = User.generate_username_from_email(user.email)
                    elif user.first_name or user.last_name:
                        # Try to generate from name
                        new_username = User.generate_username_from_name(user.first_name, user.last_name)
                    
                    # If we still don't have a username and user has a clerk_id,
                    # create a shorter, cleaner version
                    if not new_username and user.clerk_id:
                        # Extract a shorter identifier from clerk_id
                        # Remove 'user_' prefix if present
                        clean_id = user.clerk_id.replace('user_', '')[:15]
                        # Create a username like "user_abc123" instead of full clerk_id
                        new_username = f"user_{clean_id}"
                    
                    if new_username:
                        # Ensure it's unique
                        new_username = User.generate_unique_username(new_username)
                        if new_username != user.username:
                            needs_update = True
                
                # Check if email is missing but we might be able to infer it
                # (In a real scenario, you might want to fetch from Clerk API)
                if not user.email and user.username and '@' in user.username:
                    # Sometimes email might be in username
                    new_email = user.username
                    needs_update = True
                
                if needs_update:
                    if not dry_run:
                        if new_username and new_username != user.username:
                            user.username = new_username
                        if new_email and new_email != user.email:
                            user.email = new_email
                        user.save()
                    
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'User ID {user.id}:')
                    )
                    if old_username != (new_username or old_username):
                        self.stdout.write(f'  Username: "{old_username}" -> "{new_username or old_username}"')
                    if old_email != (new_email or old_email):
                        self.stdout.write(f'  Email: "{old_email or "(empty)"}" -> "{new_email or old_email or "(empty)"}"')
                    self.stdout.write('')
                else:
                    skipped_count += 1
                    if verbose:
                        self.stdout.write(f'  No changes needed for User ID {user.id}')
                        self.stdout.write('')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        if dry_run:
            self.stdout.write(self.style.WARNING(f'DRY RUN: Would update {updated_count} users'))
            self.stdout.write(self.style.WARNING(f'Would skip {skipped_count} users'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Updated {updated_count} users'))
            self.stdout.write(self.style.SUCCESS(f'Skipped {skipped_count} users (no changes needed)'))
        
        # Show users that still need manual attention
        from django.db.models import Q
        problem_users = User.objects.filter(
            Q(email__isnull=True) | Q(email='') | Q(username__startswith='user_')
        ).distinct()
        
        if problem_users.exists():
            self.stdout.write('')
            self.stdout.write(self.style.WARNING(f'⚠️  {problem_users.count()} user(s) still need attention:'))
            self.stdout.write(self.style.WARNING('   - Missing email addresses'))
            self.stdout.write(self.style.WARNING('   - Auto-generated usernames'))
            self.stdout.write(self.style.WARNING('   These will be fixed automatically when users log in next time'))
            self.stdout.write(self.style.WARNING('   (if Clerk provides their email in the JWT token)'))
        
        self.stdout.write(self.style.SUCCESS('=' * 50))

