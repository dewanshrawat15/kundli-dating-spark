
# HTML Email Templates for Supabase

These HTML/CSS email templates can be used directly in Supabase's email template configuration.

## Templates Available

1. **confirm-signup.html** - For email confirmation during user registration
2. **invite-user.html** - For user invitation emails
3. **reset-password.html** - For password reset emails

## How to Use

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Email Templates
3. Select the template you want to customize
4. Copy the HTML content from the respective file
5. Paste it into the Supabase email template editor

## Template Variables

The templates use Supabase's built-in template variables:

- `{{ .ConfirmationURL }}` - The confirmation/reset URL
- `{{ .InviterName }}` - The name of the person sending the invitation (for invite template)
- `{{ .InviteURL }}` - The invitation URL (for invite template)

## Styling

All templates use:
- Cosmic/astrological theme with dark colors
- Responsive design
- Inline CSS for maximum email client compatibility
- Gradient backgrounds and cosmic emojis
- Professional typography with the Poppins font family

## Customization

You can customize:
- Colors by modifying the CSS color values
- Text content within the HTML
- Add your own branding elements
- Modify the layout structure as needed

The templates are designed to work across all major email clients while maintaining the cosmic dating theme.
